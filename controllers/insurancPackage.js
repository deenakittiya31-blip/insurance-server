const db = require('../config/database')

exports.create = async(req, res) => {
    const client = await db.connect()

    try {
        await client.query('BEGIN')

        const { payments, car_brand_id, car_model_id, car_usage_type_id,
        compulsory_id, ...packageData } = req.body

        if (!packageData.package_name) {
            return res.status(400).json({ msg: 'กรุณาระบุชื่อแพ็กเกจ' })
        }

        //generate PK running
        const result = await client.query(`
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

        //insert package
        const columns = [...Object.keys(packageData), 'package_id']
        const values = [...Object.values(packageData), packageCode]
        //สร้าง($1, $2, $3 ...)
        const placeholders = columns.map((_, i) => `$${i + 1}`)

        const packageResualt = await client.query(`
            INSERT INTO insurance_package (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})
            RETURNING id
            `, values)

        const packageId = packageResualt.rows[0].id

        //insert payment
        for (const p of payments) {
            const {
                payment_method_id,
                discount_percent = 0,
                discount_amount = 0,
                first_payment_amount = null
            } = p

            const paymentSql = `
                INSERT INTO package_payment
                (
                    package_id,
                    payment_method_id,
                    discount_percent,
                    discount_amount,
                    first_payment_amount
                )
                VALUES ($1, $2, $3, $4, $5)
                `

            await client.query(paymentSql, [
                packageId,
                payment_method_id,
                discount_percent,
                discount_amount,
                first_payment_amount
                ])
        }

        //relation
        for(const brandId of car_brand_id){
                await client.query('INSERT INTO package_car_brand (package_id, car_brand_id) VALUES ($1, $2)', [packageId, brandId])
        }

        for(const modelId of car_model_id){
                await client.query('INSERT INTO package_car_model (package_id, car_model_id) VALUES ($1, $2)', [packageId, modelId])
        }

        for(const usageId of car_usage_type_id){
                await client.query('INSERT INTO package_usage_type (package_id, car_usage_type_id) VALUES ($1, $2)', [packageId, usageId])
        }

        for(const compulId of compulsory_id){
                await client.query('INSERT INTO package_compulsory (package_id, compulsory_id) VALUES ($1, $2)', [packageId, compulId])
        }

        await client.query('COMMIT')
        res.json({ msg: 'เพิ่มข้อมูลแพ็คเกจสำเร็จ' })
    } catch (err) {
        await client.query('ROLLBACK')
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    } finally {
        client.release()
    } 
}

exports.list = async(req, res) => {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.per_page) || 5;
    const sortKey = req.query.sortKey || 'id';
    const sortDirection = req.query.sortDirection || 'DESC';
    const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * per_page

    try {
        const result = await db.query(
            `
            SELECT 
                ip.id,
                ip.created_at,
                ip.package_id,
                ip.package_name,
                ic.namecompany,
                it.nametype,
                ip.start_date,
                ip.end_date,
                ip.repair_type,
                ip.is_active
            FROM insurance_package AS ip
            JOIN insurance_company AS ic ON ip.insurance_company_id = ic.id
            JOIN insurance_type AS it ON ip.insurance_type_id = it.id
            ORDER BY ${sortKey} ${validSortDirection} 
            LIMIT $1 OFFSET $2
            `
            , [per_page, offset])

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
        const query = 
            `
            SELECT 
                ip.*,
                COALESCE(
                    JSON_AGG(
                        DISTINCT JSON_BUILD_OBJECT(
                            'payment_method_id', pp.payment_method_id,
                            'discount_percent', pp.discount_percent,
                            'discount_amount', pp.discount_amount,
                            'first_payment_amount', pp.first_payment_amount
                        )
                    ) FILTER (WHERE pp.id IS NOT NULL),
                    '[]'
                ) AS payments,
                COALESCE(
                    JSON_AGG(
                        DISTINCT JSON_BUILD_OBJECT(
                            'id', cb.id,
                            'name', cb.name
                         )
                    ) FILTER (WHERE cb.is_active = true),
                    '[]'
                ) AS car_brand_id,
                COALESCE(
                    JSON_AGG(
                        DISTINCT JSON_BUILD_OBJECT(
                            'id', cm.id,
                            'name', cm.name
                        )
                    ) FILTER (WHERE cm.is_active = true),
                    '[]'
                ) AS car_model_id,
                COALESCE(
                    JSON_AGG(
                        DISTINCT JSON_BUILD_OBJECT(
                            'id', cut.id,
                            'car_type', ct.type,
                            'usage', cu.usage_name,
                            'code_usage', cut.code_usage
                        )
                    ) FILTER (WHERE cut.is_active = true),
                    '[]'
                ) AS car_usage_type_id,
                COALESCE(
                    JSON_AGG(
                        DISTINCT JSON_BUILD_OBJECT(
                            'id', ci.id,
                            'detail', ci.detail,
                            'code_sub', ci.code_sub
                        )
                    ) FILTER (WHERE ci.is_active = true),
                    '[]'
                ) AS compusory_id
            FROM insurance_package AS ip
            LEFT JOIN package_car_brand AS pcb ON ip.id = pcb.package_id
            JOIN car_brand AS cb ON pcb.car_brand_id = cb.id

            LEFT JOIN package_car_model AS pcm ON ip.id = pcm.package_id
            JOIN car_model AS cm ON pcm.car_model_id = cm.id

            LEFT JOIN package_usage_type AS put ON ip.id = put.package_id
            JOIN car_usage_type AS cut ON put.car_usage_type_id = cut.id
            JOIN car_type AS ct ON cut.car_type_id = ct.id
            JOIN car_usage AS cu ON cut.car_usage_id = cu.id

            LEFT JOIN package_compulsory AS pcs ON ip.id = pcs.package_id
            JOIN compulsory_insurance AS ci ON pcs.compulsory_id = ci.id

            LEFT JOIN package_payment AS pp ON ip.id = pp.package_id
            JOIN payment_methods AS pm ON pp.payment_method_id = pm.id
            WHERE ip.id = $1
            GROUP BY ip.id, ip.package_name, ip.insurance_company_id, ip.insurance_type_id
            `

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