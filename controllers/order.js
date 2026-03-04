const db = require('../config/database')
const { pushOrderFlex } = require('../services/lineService')

exports.create = async (req, res) => {
    try {
         const { compare_id = null, package_id, premium_id, member_id } = req.body

    const result = await db.query(
        `INSERT INTO premium_on_order 
         (compare_id, package_id, premium_id, member_id, status, expired_at)
         VALUES ($1, $2, $3, $4, 'รอดำเนินการ', now() + interval '30 minutes')
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

        const orderResult  = await db.query(
            `
            select
                poo.id,
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
                pgd.discount_percent as group_discount_percent,
                ipm.total_premium * 0.9309 as net_total,
                ipm.premium_discount
            from
                premium_on_order poo
            join insurance_premium ipm on poo.premium_id = ipm.id
            join insurance_package ipk on poo.package_id = ipk.id
            join insurance_company icp on ipk.insurance_company = icp.id
            join insurance_type it on ipk.insurance_type = it.id
            join member m on poo.member_id = m.id
            left join package_group_discount pgd on pgd.package_id = ipk.id
                and pgd.group_code = m.group_id
            where
                poo.id = $1
            `, [id]
        )

        const order = orderResult.rows[0]

        //ดึง payment methods ทั้งหมด + ส่วนลดของ package นี้
        const paymentResult = await db.query(`
            SELECT
                pm.id as payment_method_id,
                pm.name_payment,
                pp.discount_percent as payment_discount_percent,
                pp.discount_amount  as payment_discount_amount,
                pp.charge,
                pp.first_payment_amount,
                pp.installment_min,
                pp.installment_max,
                ROUND(
                    $2::numeric - (
                        ($3::numeric) * (
                            COALESCE($4::numeric, 0) / 100.0
                            + COALESCE($5::numeric, 0) / 100.0
                            + COALESCE(pp.discount_percent, 0) / 100.0
                        ) + COALESCE(pp.discount_amount, 0)
                    ), 2
                ) as selling_price_final
            FROM payment_methods pm
            LEFT JOIN package_payment pp
                ON  pp.payment_method_id = pm.id
                AND pp.package_id = $1
            ORDER BY pm.id ASC
        `, [
            order.package_id,
            order.total_premium,
            order.net_total,
            order.premium_discount,
            order.group_discount_percent
        ])

        // แยก info กับ payments
    const info = {
        compare_id:            order.compare_id,
        premium_name:          order.premium_name,
        total_premium:         order.total_premium,
        logo_url:              order.logo_url,
        insurance_type:        order.insurance_type,
        repair_type:           order.repair_type,
        package_name:          order.package_name,
        selling_price:         order.selling_price,
        premium_discount:      order.premium_discount
    }

    const payments = paymentResult.rows.map(row => ({
        payment_method_id:        row.payment_method_id,
        name_payment:             row.name_payment,
        payment_discount_percent: row.payment_discount_percent,
        payment_discount_amount:  row.payment_discount_amount,
        charge:                   row.payment_charge,
        first_payment_amount:     row.first_payment_amount,
        installment_min:          row.installment_min,
        installment_max:          row.installment_max,
        selling_price_final:      row.selling_price_final,
        group_discount_percent:   order.group_discount_percent,
        net_total:                order.net_total,
    }))

    res.json({ info, payments })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.confirmOrder = async (req, res) => {
     const client = await db.connect()

    try {
        await client.query('BEGIN')

        const { id } = req.params

        const {
            address_id, payment_method_id, installment,
            selling_price, discount_price,
            snap_discount_pct, snap_discount_amt,
            snap_charge, snap_first_payment, snap_group_discount
        } = req.body

        //สร้างคำสั่งซื้อ
        const orderResult = await client.query(`
            SELECT order_id FROM premium_on_order
            WHERE order_id IS NOT NULL
            ORDER BY id DESC LIMIT 1
            FOR UPDATE
        `)

        let nextNumber = 1;
        if (orderResult.rows.length) {
            const lastCode = orderResult.rows[0].order_id; 
            const lastNumber = parseInt(lastCode.replace('PO', ''), 10);
            nextNumber = lastNumber + 1;
        }

        const orderCode = `PO${String(nextNumber).padStart(5, '0')}`;

        await client.query(`
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
                order_id            = $12,
                status              = 'สั่งซื้อสำเร็จ',
                expired_at          = NULL
                created_at          = now()
            WHERE id = $1
            RETURNING order_id
        `, [
            id,
            address_id, payment_method_id, installment,
            selling_price, discount_price,
            snap_discount_pct, snap_discount_amt,
            snap_charge, snap_first_payment, snap_group_discount, orderCode
        ])

        await client.query('COMMIT') 

        //ดึงข้อมูลส่ง flexcard
        const result = await db.query(
            `
            select
                -- premium & package data
                poo.order_id,
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

        console.log(data)

        await pushOrderFlex(data.user_id, data)

        res.json({ msg: 'สั่งซื้อสำเร็จ' })
    } catch (err) {
        await client.query('ROLLBACK')
        console.log(err)
        res.status(500).json({message: 'Server error'})
    } finally {
        client.release()
    }
}

exports.getHistoryOrder = async(req, res) => {
    try {
        const { id } = req.user

        const result = await db.query(
            `
            select
                poo.order_id,
                ipm.premium_name,
                ipk.package_name,
                it.nametype,
                ipk.repair_type,
                icp.logo_url,
                poo.selling_price,
                poo.status,
                poo.tracking_order_id as tracking,
                poo.id
            from
                premium_on_order poo
            join insurance_package ipk on poo.package_id = ipk.id
            join insurance_premium ipm on poo.premium_id = ipm.id
            join insurance_type it on ipk.insurance_type = it.id
            join insurance_company icp on ipk.insurance_company = icp.id
            where member_id = $1
            order by poo.order_id desc
            `
            , [id]
        )

        if(result.rowCount === 0) {
            return res.status(200).json({data: []})
        }

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.deleteOrder = async(req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.id

        const result = await db.query('select member_id from premium_on_order where id = $1', [id])
        
        if(result.rows[0].member_id !== userId) {
            return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบ" });
        }

        await db.query(`delete from premium_on_order where id = $1`, [id])

        res.json({ message: 'ยกเลิกคำสั่งซื้อสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.listOrder = async(req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortKey = 'id',
            sortDirection = 'DESC',
            search
        } = req.query;

        const sortColumnMap = {
            order_id: 'poo.order_id',
            created_at: 'poo.created_at',
            first_name: 'm.first_name',
            compare_id: 'poo.compare_id',
            premium_id: 'ipm.premium_id',
            premium_name: 'ipm.premium_name',
            name_payment: 'pmt.name_payment'
        };

        const pageNum = parseInt(page, 10)
        const limitNum = parseInt(limit, 10)
        const offset = (pageNum - 1) * limitNum
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const finalSortKey = sortColumnMap[sortKey] || 'poo.order_id';

        let conditions = [];
        let values = [];
        let paramIndex = 1;

        if (search) {
            conditions.push(`
                (
                poo.order_id ILIKE $${paramIndex}
                OR ipk.package_name ILIKE $${paramIndex}
                OR TO_CHAR(poo.created_at, 'DD/MM/YYYY') ILIKE $${paramIndex} 
                OR m.first_name ILIKE $${paramIndex} 
                OR poo.compare_id ILIKE $${paramIndex} 
                OR ipm.premium_id ILIKE $${paramIndex} 
                OR ipm.premium_name ILIKE $${paramIndex} 
                OR pmt.name_payment ILIKE $${paramIndex}
                OR ipk.package_id ILIKE $${paramIndex}
                OR poo.status ILIKE $${paramIndex}
                OR poo.selling_price::text ILIKE $${paramIndex}
                OR poo.tracking_order_id ILIKE $${paramIndex}
                )
            `);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const countResult = await db.query(
            `
            SELECT COUNT(*)::int as total 
            FROM premium_on_order poo 
            join insurance_package ipk on poo.package_id = ipk.id
            join insurance_premium ipm on poo.premium_id = ipm.id
            join insurance_type it on ipk.insurance_type = it.id
            join insurance_company icp on ipk.insurance_company = icp.id
            join payment_methods pmt on poo.payment_method_id = pmt.id
            join member m on poo.member_id = m.id
            left join address ad on ad.id = poo.address_id
            ${whereClause}`, values)

        const totalItems = countResult.rows[0].total
        const totalPages = Math.ceil(totalItems / limitNum)


        const result = await db.query(
            `
            select
                poo.id,
                poo.order_id,
                poo.created_at,
                poo.selling_price,
                poo.status as statusOnOrder,
                poo.compare_id,
                pmt.name_payment,
                poo.tracking_order_id,
                --premium and package
                ipm.premium_name,
                ipm.premium_id,
                ipk.package_name,
                ipk.package_id,
                ipk.repair_type,
                it.nametype,
                icp.logo_url,
                --member
                m.first_name,
                m.picture_url,
                --snapshot price
                poo.installment,
                poo.discount_price,
                poo.snap_discount_pct,
                poo.snap_discount_amt,
                poo.snap_charge,
                poo.snap_first_payment,
                poo.snap_group_discount,
                --address member
                ad.address_line,
                ad.subdistrict,
                ad.district,
                ad.province,
                ad.zipcode,
                ad.phone,
                ad.full_name
            from
                premium_on_order poo
            join insurance_package ipk on poo.package_id = ipk.id
            join insurance_premium ipm on poo.premium_id = ipm.id
            join insurance_type it on ipk.insurance_type = it.id
            join insurance_company icp on ipk.insurance_company = icp.id
            join payment_methods pmt on poo.payment_method_id = pmt.id
            join member m on poo.member_id = m.id
            left join address ad on ad.id = poo.address_id
            ${whereClause} 
            ORDER BY ${finalSortKey} ${validSortDirection} 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `
            , [...values, limitNum, offset])

        res.json({
            data: result.rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.changeStatusOrder = async(req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        await db.query('update premium_on_order set status = $2 where id = $1', [id, status])

        res.status(200).json({ msg: 'อัปเดตสถานะสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.updateTrackingOrder = async(req, res) => {
    try {
        const { tracking } = req.body;
        const { id } = req.params;

        await db.query('update premium_on_order SET tracking_order_id = $2 WHERE id = $1', [id, tracking])

        res.json({msg: 'เพิ่มเลขพัสดุสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}