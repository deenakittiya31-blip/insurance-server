const db = require('../config/database')
const { GET_DETAIL_PACKAGE } = require('../services/packageQueries')

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

        const packageCode = `PK${String(nextNumber).padStart(5, '0')}`;

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
                (
                  SELECT COUNT(*)::int 
                  FROM insurance_premium ipm 
                  WHERE ipm.package_id = ip.id
                ) as premium_count,
                ip.is_active
            FROM insurance_package AS ip
            JOIN insurance_company AS ic ON ip.insurance_company = ic.id
            JOIN insurance_type AS it ON ip.insurance_type = it.id
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

exports.searchPackage = async(req, res) => {
    try {
        const { search } = req.body;

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
                (
                  SELECT COUNT(*)::int 
                  FROM insurance_premium ipm 
                  WHERE ipm.package_id = ip.id
                ) as premium_count,
                ip.is_active
            FROM insurance_package AS ip
            JOIN insurance_company AS ic ON ip.insurance_company = ic.id
            JOIN insurance_type AS it ON ip.insurance_type = it.id
            WHERE
                ip.package_id ILIKE $1 OR
                ip.package_name ILIKE $1 OR
                ip.start_date ILIKE $1 OR
                ip.end_date ILIKE $1 OR
                ip.created_at ILIKE $1 OR
                ip.repair_type ILIKE $1 OR
                ip.promotion ILIKE $1 OR
                ic.namecompany ILIKE $1 OR
                it.nametype ILIKE $1
            ORDER BY created_at DESC
            `,
            [`%${search}%`]
        );

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.StatusIsActive = async(req, res) => {
    try {
            const { is_active } = req.body
            const { id } = req.params

            await db.query('UPDATE insurance_package SET is_active = $1 WHERE id = $2', 
            [is_active, id])

        res.json({msg: 'อัปเดตสถานะแพ็กเกจสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query(
            `
            SELECT id, package_id, package_name 
            FROM insurance_package 
            WHERE is_active = true
            ORDER BY id DESC` 
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
                ip.id,
                ip.package_name,
                ip.insurance_company,
                ic.namecompany,
                ip.insurance_type,
                it.nametype,
                ip.repair_type,
                ip.engine_size,
                ip.promotion,
                ip.thirdparty_injury_death_per_person,
                ip.thirdparty_injury_death_per_accident,
                ip.thirdparty_property,
                ip.flood_cover,
                ip.car_own_damage_deductible,
                ip.additional_personal_permanent_driver_cover,
                ip.additional_medical_expense_cover,
                ip.additional_bail_bond,
                ip.additional_personal_permanent_driver_number,
                ip.is_active,
                ip.created_at,
                (
                  SELECT COUNT(*)::int 
                  FROM insurance_premium ipm 
                  WHERE ipm.package_id = ip.id
                ) as premium_count,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'payment_method_id', pp.payment_method_id,
                            'payment_name', pm.name_payment,
                            'discount_percent', pp.discount_percent,
                            'discount_amount', pp.discount_amount,
                            'first_payment_amount', pp.first_payment_amount
                        )
                    ) FILTER (WHERE pp.payment_method_id IS NOT NULL),
                    '[]'::jsonb
                ) AS payments,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'id', cb.id,
                            'name', cb.name
                         )
                    ) FILTER (WHERE cb.id IS NOT NULL),
                    '[]'::jsonb
                ) AS car_brand_id,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'id', cm.id,
                            'name', cm.name
                        )
                    ) FILTER (WHERE cm.id IS NOT NULL),
                    '[]'::jsonb
                ) AS car_model_id,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'id', cut.id,
                            'car_type', ct.type,
                            'usage', cu.usage_name,
                            'code_usage', cut.code_usage
                        )
                    ) FILTER (WHERE cut.id IS NOT NULL),
                    '[]'::jsonb
                ) AS car_usage_type_id,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'id', ci.id,
                            'detail', ci.detail,
                            'code_sub', ci.code_sub
                        )
                    ) FILTER (WHERE ci.id IS NOT NULL),
                    '[]'::jsonb
                ) AS compusory_id
            FROM insurance_package AS ip
            LEFT JOIN insurance_company AS ic ON ip.insurance_company = ic.id
            LEFT JOIN insurance_type AS it ON ip.insurance_type = it.id

            LEFT JOIN package_car_brand AS pcb ON ip.id = pcb.package_id
            LEFT JOIN car_brand AS cb ON pcb.car_brand_id = cb.id

            LEFT JOIN package_car_model AS pcm ON ip.id = pcm.package_id
            LEFT JOIN car_model AS cm ON pcm.car_model_id = cm.id

            LEFT JOIN package_usage_type AS put ON ip.id = put.package_id
            LEFT JOIN car_usage_type AS cut ON put.car_usage_type_id = cut.id
            LEFT JOIN car_type AS ct ON cut.car_type_id = ct.id
            LEFT JOIN car_usage AS cu ON cut.car_usage_id = cu.id

            LEFT JOIN package_compulsory AS pcs ON ip.id = pcs.package_id
            LEFT JOIN compulsory_insurance AS ci ON pcs.compulsory_id = ci.id

            LEFT JOIN package_payment AS pp ON ip.id = pp.package_id
            LEFT JOIN payment_methods AS pm ON pp.payment_method_id = pm.id
            WHERE ip.id = $1
            GROUP BY 
                ip.id,
                ip.package_name,
                ip.insurance_company,
                ic.namecompany,
                ip.insurance_type,
                it.nametype,
                ip.repair_type,
                ip.promotion,
                ip.thirdparty_injury_death_per_person,
                ip.thirdparty_injury_death_per_accident,
                ip.thirdparty_property,
                ip.flood_cover,
                ip.car_own_damage_deductible,
                ip.additional_personal_permanent_driver_cover,
                ip.additional_medical_expense_cover,
                ip.additional_bail_bond,
                ip.additional_personal_permanent_driver_number,
                ip.is_active,
                ip.created_at
            `
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
         console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.readEdit = async(req, res) => {
    const {id} = req.params

    try {
        const query = 
            `
            SELECT 
                ip.*,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'payment_method_id', pp.payment_method_id,
                            'payment_name', pm.name_payment,
                            'discount_percent', pp.discount_percent,
                            'discount_amount', pp.discount_amount,
                            'first_payment_amount', pp.first_payment_amount
                        )
                    ) FILTER (WHERE pp.payment_method_id IS NOT NULL),
                    '[]'::jsonb
                ) AS payments,
                COALESCE(ARRAY_AGG(DISTINCT pcb.car_brand_id) FILTER (WHERE pcb.car_brand_id IS NOT NULL), '{}') AS car_brand_id,
                COALESCE(ARRAY_AGG(DISTINCT pcm.car_model_id) FILTER (WHERE pcm.car_model_id IS NOT NULL), '{}') AS car_model_id,
                COALESCE(ARRAY_AGG(DISTINCT put.car_usage_type_id) FILTER (WHERE put.car_usage_type_id IS NOT NULL), '{}') AS car_usage_type_id,
                COALESCE(ARRAY_AGG(DISTINCT pcs.compulsory_id) FILTER (WHERE pcs.compulsory_id IS NOT NULL), '{}') AS compulsory_id
            FROM insurance_package AS ip
            LEFT JOIN insurance_company AS ic ON ip.insurance_company = ic.id
            LEFT JOIN insurance_type AS it ON ip.insurance_type = it.id

            LEFT JOIN package_car_brand AS pcb ON ip.id = pcb.package_id
            LEFT JOIN car_brand AS cb ON pcb.car_brand_id = cb.id

            LEFT JOIN package_car_model AS pcm ON ip.id = pcm.package_id
            LEFT JOIN car_model AS cm ON pcm.car_model_id = cm.id

            LEFT JOIN package_usage_type AS put ON ip.id = put.package_id
            LEFT JOIN car_usage_type AS cut ON put.car_usage_type_id = cut.id
            LEFT JOIN car_type AS ct ON cut.car_type_id = ct.id
            LEFT JOIN car_usage AS cu ON cut.car_usage_id = cu.id

            LEFT JOIN package_compulsory AS pcs ON ip.id = pcs.package_id
            LEFT JOIN compulsory_insurance AS ci ON pcs.compulsory_id = ci.id

            LEFT JOIN package_payment AS pp ON ip.id = pp.package_id
            LEFT JOIN payment_methods AS pm ON pp.payment_method_id = pm.id
            WHERE ip.id = $1
            GROUP BY ip.id
            `
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
         console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const { id } = req.params
    const client = await db.connect()

    try {
        await client.query('BEGIN')

        const { payments, car_brand_id, car_model_id, car_usage_type_id,
            compulsory_id, ...packageData } = req.body

        // 1. เช็คว่า package มีอยู่จริง
        const checkResult = await client.query(
            'SELECT * FROM insurance_package WHERE id = $1', 
            [id]
        )

        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        if(Object.keys(packageData).length > 0) {
            // 2. Update insurance_package
            const columns = Object.keys(packageData)
            const values = Object.values(packageData)

            const setClauses = columns.map((col, idx) => `${col} = $${idx + 1}`)

            const updatePackageSql = `
                UPDATE insurance_package 
                SET ${setClauses.join(', ')}
                WHERE id = $${columns.length + 1}
            `

            await client.query(updatePackageSql, [...values, id])
        }

        // 3. Update payment methods
        if (payments !== undefined) {
            // ลบของเก่าทั้งหมด
            await client.query('DELETE FROM package_payment WHERE package_id = $1', [id])
            
            // Insert ของใหม่ (ถ้ามี)
            if (payments.length > 0) {
                for (const p of payments) {
                    const {
                        payment_method_id,
                        discount_percent = 0,
                        discount_amount = 0,
                        first_payment_amount = null
                    } = p

                    await client.query(`
                        INSERT INTO package_payment
                        (package_id, payment_method_id, discount_percent, discount_amount, first_payment_amount)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [id, payment_method_id, discount_percent, discount_amount, first_payment_amount])
                }
            }
        }

        // 4. Update car_brand
        if (car_brand_id !== undefined) {
            await client.query('DELETE FROM package_car_brand WHERE package_id = $1', [id])
            
            if (car_brand_id.length > 0) {
                for (const brandId of car_brand_id) {
                    await client.query(
                        'INSERT INTO package_car_brand (package_id, car_brand_id) VALUES ($1, $2)', 
                        [id, brandId]
                    )
                }
            }
        }

        // 5. Update car_model
        if (car_model_id !== undefined) {
            await client.query('DELETE FROM package_car_model WHERE package_id = $1', [id])
            
            if (car_model_id.length > 0) {
                for (const modelId of car_model_id) {
                    await client.query(
                        'INSERT INTO package_car_model (package_id, car_model_id) VALUES ($1, $2)', 
                        [id, modelId]
                    )
                }
            }
        }

        // 6. Update car_usage_type
        if (car_usage_type_id !== undefined) {
            await client.query('DELETE FROM package_usage_type WHERE package_id = $1', [id])
            
            if (car_usage_type_id.length > 0) {
                for (const usageId of car_usage_type_id) {
                    await client.query(
                        'INSERT INTO package_usage_type (package_id, car_usage_type_id) VALUES ($1, $2)', 
                        [id, usageId]
                    )
                }
            }
        }

        // 7. Update compulsory
        if (compulsory_id !== undefined) {
            await client.query('DELETE FROM package_compulsory WHERE package_id = $1', [id])
            
            if (compulsory_id.length > 0) {
                for (const compulId of compulsory_id) {
                    await client.query(
                        'INSERT INTO package_compulsory (package_id, compulsory_id) VALUES ($1, $2)', 
                        [id, compulId]
                    )
                }
            }
        }


        await client.query('COMMIT')
        res.json({ msg: 'อัปเดตข้อมูลแพ็กเกจสำเร็จ' })
    } catch (err) {
        await client.query('ROLLBACK')
        console.log(err)
        res.status(500).json({ message: 'Server error' })
    } finally {
        client.release()
    }
}     

exports.copy = async(req, res) => {
    try {
        const {id} = req.params

        const result = await db.query(GET_DETAIL_PACKAGE, [id])
        const oldPackage = result.rows[0]

         //destructure 
        const {
            id: oldId,
            package_id,
            payments,
            car_brand_id,
            car_model_id,
            car_usage_type_id,
            compulsory_id,
            ...packageData   
        } = oldPackage

         //generate PK running
        const resultId = await db.query(`
         SELECT package_id
         FROM insurance_package
         ORDER BY id DESC
         LIMIT 1
         FOR UPDATE
        `);

        let nextNumber = 1;
        if (resultId.rows.length) {
            const lastCode = resultId.rows[0].package_id; // PK00000000012
            const lastNumber = parseInt(lastCode.replace('PK', ''), 10);
            nextNumber = lastNumber + 1;
        }

        const newPackageCode = `PK${String(nextNumber).padStart(11, '0')}`;

        //insert package
        const columns = [...Object.keys(packageData), 'package_id']
        const values = [...Object.values(packageData), newPackageCode]
        const placeholders = columns.map((_, i) => `$${i + 1}`)

        const packageResualt = await db.query(`
            INSERT INTO insurance_package (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})
            RETURNING id
            `, values)

        const newPackageId = packageResualt.rows[0].id

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

            await db.query(paymentSql, [
                newPackageId,
                payment_method_id,
                discount_percent,
                discount_amount,
                first_payment_amount
                ])
        }

        //relation
        for(const brandId of car_brand_id){
                await db.query('INSERT INTO package_car_brand (package_id, car_brand_id) VALUES ($1, $2)', [newPackageId, brandId])
        }

        for(const modelId of car_model_id){
                await db.query('INSERT INTO package_car_model (package_id, car_model_id) VALUES ($1, $2)', [newPackageId, modelId])
        }

        for(const usageId of car_usage_type_id){
                await db.query('INSERT INTO package_usage_type (package_id, car_usage_type_id) VALUES ($1, $2)', [newPackageId, usageId])
        }

        for(const compulId of compulsory_id){
                await db.query('INSERT INTO package_compulsory (package_id, compulsory_id) VALUES ($1, $2)', [newPackageId, compulId])
        }

        res.json({
            msg: 'คัดลอกแพ็กเกจสำเร็จ',
            id: newPackageId 
        })
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