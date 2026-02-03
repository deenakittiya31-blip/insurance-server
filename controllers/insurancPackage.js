const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { payments, car_brand_id, car_model_id, car_type_id,
        compulsory_id, ...packageData } = req.body

        if (!packageData.package_name) {
            return res.status(400).json({ msg: 'กรุณาระบุชื่อแพ็กเกจ' })
        }

        const columns = Object.keys(packageData)
        const values = Object.values(packageData)

        //สร้าง($1, $2, $3 ...)
        const placeholders = columns.map((_, i) => `$${i + 1}`)

        const result = await db.query(`
         SELECT package_id
         FROM insurance_package
         ORDER BY id DESC
         LIMIT 1
         FOR UPDATE
        `);

        let nextNumber = 1;

        if (result.rows.length) {
            const lastCode = result.rows[0].package_id; // PK00000000012
            const lastNumber = parseInt(lastCode.replace('PK', ''), 10);
            nextNumber = lastNumber + 1;
        }

        const packageCode = `PK${String(nextNumber).padStart(11, '0')}`;

        console.log(packageCode)

        // //อย่าลืมเพิ่ม รหัสแพ็กเกจเข้าไปด้วย
        // const packageResualt = await db.query(`
        //     INSERT INTO insurance_package (${columns.join(', ')}, package_id)
        //     VALUES (${placeholders.join(', ')}, $19)
        //     RETURNING id
        //     `, values, packageCode)

        // const packageId = packageResualt.rows[0].id
        // if (Array.isArray(payments)) {
        //     for (const p of payments) {
        //         const {
        //         payment_method_id,
        //         discount_percent = 0,
        //         discount_amount = 0,
        //         first_payment_amount = null
        //         } = p

        //         const paymentSql = `
        //         INSERT INTO insurance_package_payments
        //         (
        //             package_id,
        //             payment_method_id,
        //             discount_percent,
        //             discount_amount,
        //             first_payment_amount
        //         )
        //         VALUES ($1, $2, $3, $4, $5)
        //         `

        //         await db.query(paymentSql, [
        //             packageId,
        //             payment_method_id,
        //             discount_percent,
        //             discount_amount,
        //             first_payment_amount
        //         ])
        //     }
        // }

        res.json({ msg: 'เพิ่มข้อมูลแพ็คเกจสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.per_page) || 5;

    const offset = (page - 1) * per_page

    try {
        const query = `
        SELECT 
            ip.id, 
            ic.namecompany as company, 
            it.nametype as type, package_name, 
            cu.usage_name AS usage, 
            cy.year_be, 
            cy.year_ad,  
            cb.name AS car_brand, 
            cm.name AS car_model
        FROM insurance_package as ip 
        JOIN insurance_company as ic ON ip.company_id = ic.id 
        JOIN insurance_type as it ON ip.insur_type_id = it.id 
        LEFT JOIN car_brand AS cb ON ip.car_brand_id = cb.id 
        LEFT JOIN car_model AS cm ON ip.car_model_id = cm.id 
        LEFT JOIN car_usage AS cu ON ip.usage_car_id = cu.id 
        LEFT JOIN car_year AS cy ON ip.car_year_id = cy.id 
        ORDER BY ip.id ASC LIMIT $1 OFFSET $2`

        const result = await db.query(query, [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM insurance_package')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query(
            'SELECT id, package_name FROM insurance_package order by created_at desc' 
        )

         res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    const {id} = req.params

    try {
         const query = 'SELECT id, company_id, insurance_type_id, package_name, coverage_amount FROM insurance_package WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
         console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {company_id, insurance_type_id, package_name, coverage_amount} = req.body

    try {
        const result = await db.query('SELECT * FROM  insurance_package WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]

        await db.query('UPDATE  insurance_package SET company_id = $1, insurance_type_id = $2, package_name = $3, coverage_amount = $4  WHERE id = $5', 
            [
                company_id          !== undefined ? Number(company_id)          :  old.company_id,             
                insurance_type_id   !== undefined ? Number(insurance_type_id)   :  old.insurance_type_id,             
                package_name        !== undefined ? package_name                : old.package_name,             
                coverage_amount     !== undefined ? Number(coverage_amount)     :  old.coverage_amount,             
                id
            ])

        res.json({msg: 'อัปเดตข้อมูลแพ็กเกจสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
         const {id} = req.params

         await db.query('DELETE FROM insurance_package WHERE id = $1', [id])

         res.json({msg: 'ลบข้อมูลแพ็กเกจสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}