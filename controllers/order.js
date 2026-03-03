const db = require('../config/database')
const { sendText } = require('../services/lineService')

exports.create = async (req, res) => {
    try {
         const { compare_id, package_id, premium_id, member_id } = req.body

    const result = await db.query(
        `INSERT INTO premium_on_order 
         (compare_id, package_id, premium_id, member_id, status, expired_at)
         VALUES ($1, $2, $3, $4, 'pending', now() + interval '30 minutes')
         RETURNING id`,
        [compare_id, package_id, premium_id, member_id]
    )

    res.json({ order_id: result.rows[0].id })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.getOrderDetail = async(req, res) => {
    try {
        const { id } = req.params

        const result = await db.query(
            `
            select
                -- premium & package data
                poo.id as order_id,
                poo.compare_id,
                ipm.id as premium_id,
                ipm.premium_name,
                ipm.selling_price,
                ipm.total_premium,
                ipk.id as package_id,
                ipk.package_name,
                ipk.repair_type,
                icp.logo_url,
                it.nametype as insurance_type,
                -- payment method data
                pm.id as payment_method_id,
                pm.name_payment,
                pp.discount_percent as payment_discount_percent,
                pp.discount_amount as payment_discount_amount,
                pp.charge as payment_charge,
                pp.first_payment_amount,
                pp.installment_min,
                pp.installment_max,
                -- group discount
                pgd.discount_percent as group_discount_percent,
                -- คำนวณราคาแต่ละวิธีชำระ
                ipm.total_premium * 0.9309 as net_total,
                ipm.premium_discount,
                ROUND(
                    ipm.total_premium - (
                    (ipm.total_premium * 0.9309) * (
                        COALESCE(ipm.premium_discount, 0) / 100.0 + COALESCE(pgd.discount_percent, 0) / 100.0 + COALESCE(pp.discount_percent, 0) / 100.0
                    ) + COALESCE(pp.discount_amount, 0)
                    ),
                    2
                ) as selling_price_final
            from
                premium_on_order poo
            join insurance_premium ipm on poo.premium_id = ipm.id
            join insurance_package ipk on poo.package_id = ipk.id
            join insurance_company icp on ipk.insurance_company = icp.id
            join insurance_type it on ipk.insurance_type = it.id
            join member m on poo.member_id = m.id
            -- join ทุก payment method ของ package นี้
            join package_payment pp on pp.package_id = ipk.id
            join payment_methods pm on pp.payment_method_id = pm.id
            -- left join เพราะ group อาจไม่มีส่วนลด
            left join package_group_discount pgd on pgd.package_id = ipk.id
            and pgd.group_code = m.group_id
            where
                poo.id = $1
            order by pp.payment_method_id asc
            `, [id]
        )

        if (result.rows.length === 0)
        return res.status(404).json({ message: 'ไม่พบข้อมูล' })

        // แยก info กับ payments
    const first = result.rows[0]
    const info = {
        compare_id:            first.compare_id,
        premium_name:          first.premium_name,
        total_premium:         first.total_premium,
        logo_url:              first.logo_url,
        insurance_type:        first.insurance_type,
        repair_type:           first.repair_type,
        package_name:           first.package_name,
        selling_price:          first.selling_price,
        premium_discount:          first.premium_discount
    }

    const payments = result.rows.map(row => ({
        payment_method_id:        row.payment_method_id,
        name_payment:             row.name_payment,
        payment_discount_percent: row.payment_discount_percent,
        payment_discount_amount:  row.payment_discount_amount,
        charge:                   row.payment_charge,
        first_payment_amount:     row.first_payment_amount,
        installment_min:          row.installment_min,
        installment_max:          row.installment_max,
        selling_price_final:      row.selling_price_final,
        group_discount_percent:   row.group_discount_percent,
        net_total:                row.net_total
    }))

    res.json({ info, payments })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.confirmOrder = async (req, res) => {
    const { id } = req.params
    const {
        address_id, payment_method_id, installment,
        selling_price, discount_price,
        snap_discount_pct, snap_discount_amt,
        snap_charge, snap_first_payment, snap_group_discount
    } = req.body

    //สร้างคำสั่งซื้อ

    await db.query(`
        UPDATE premium_on_order SET
            address_id          = $2,
            payment_method_id   = $3,
            installment         = $4,
            selling_price       = $5,
            discount_price      = $6,
            snap_discount_pct   = $7,
            snap_discount_amt   = $8,
            snap_charge         = $9,
            snap_first_payment  = $10,
            snap_group_discount = $11,
            status              = 'confirmed',
            expired_at          = NULL
        WHERE id = $1
    `, [
        id,
        address_id, payment_method_id, installment,
        selling_price, discount_price,
        snap_discount_pct, snap_discount_amt,
        snap_charge, snap_first_payment, snap_group_discount
    ])

    const result = await db.query(
        `
        select
            -- premium & package data
            poo.id as order_id,
            poo.compare_id,
            ipm.premium_name,
            ipm.premium_id,
            poo.selling_price,
            ipm.total_premium,
            ipk.package_name,
            ipk.package_id,
            ipk.repair_type,
            icp.namecompany,
            it.nametype,
            -- payment method data
            pm.name_payment,
             -- member
            m.user_id,
            m.first_name
        from
            premium_on_order poo
        join insurance_premium ipm on poo.premium_id = ipm.id
        join insurance_package ipk on poo.package_id = ipk.id
        join insurance_company icp on ipk.insurance_company = icp.id
        join insurance_type it on ipk.insurance_type = it.id
        join payment_methods pm on poo.payment_method_id = pm.id
        join member m on poo.member_id = m.id
        where
            poo.id = $1
        `, [id]
    )

    const data = result.rows[0]

    await sendText(data.user_id, (`คุณ${data.first_name} ได้สั่งซื้อเบี้ยประกันรถยนต์รหัสที่ ${data.premium_id} ชื่อ ${data.premium_name} จากแพ็กเกจรหัส ${data.package_id} ชื่อ ${data.package_name} รายละเอียดเบี้ยประกันรถยนต์มีดังนี้ 1.บริษัท${data.namecompany} 2.ประเภทประกัน${data.nametype} 3.${data.repair_type} 4.วิธีการชำระเงิน: ${data.name_payment} 5.ราคาเบี้ยเดิม ${data.total_premium} เหลือ ${data.selling_price}`))

    res.json({ msg: 'สั่งซื้อสำเร็จ' })
}