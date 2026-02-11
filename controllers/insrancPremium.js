const db = require('../config/database')
const { GET_LIST_PREMIUM } = require('../services/premiumQuery')

exports.create = async(req, res) => {
    const client = await db.connect()

    try {
        await client.query('BEGIN')

        const { package_id, premium_discount, premiums } = req.body

        for(const p of premiums){

            const result = await client.query(`
                SELECT premium_id
                FROM insurance_premium
                ORDER BY id DESC
                LIMIT 1
                FOR UPDATE
            `);

            let nextNumber = 1;
            if (result.rows.length) {
                const lastCode = result.rows[0].premium_id; // PM00000000012
                const lastNumber = parseInt(lastCode.replace('PM', ''), 10);
                nextNumber = lastNumber + 1;
            }

            const premiumCode = `PM${String(nextNumber).padStart(5, '0')}`;

            const columns = [...Object.keys(p), 'premium_id', 'package_id', 'premium_discount']
            const values = [...Object.values(p), premiumCode, package_id, premium_discount]
            //สร้าง($1, $2, $3 ...)
            const placeholders = columns.map((_, i) => `$${i + 1}`)

            await client.query(
                `
                INSERT INTO insurance_premium (${columns.join(', ')})
                VALUES (${placeholders.join(', ')})
                `, values
            )
        }

        await client.query('COMMIT')
        res.json({ msg: 'เพิ่มข้อมูลเบี้ยประกันสำเร็จ' })
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
                ipm.*, 
                ipk.package_name,
                ipk.package_id,
                ipk.start_date,
                ipk.end_date,
                icp.namecompany,
                it.nametype,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'code_type', ct.code,
                            'code_usage', cut.code_usage
                        )
                    ) FILTER (WHERE ct.id IS NOT NULL),
                    '[]'::jsonb
                ) AS type
            FROM insurance_premium AS ipm
            LEFT JOIN insurance_package AS ipk ON ipm.package_id = ipk.id 
            LEFT JOIN insurance_company AS icp ON ipk.insurance_company = icp.id 
            LEFT JOIN insurance_type AS it ON ipk.insurance_type = it.id 

            LEFT JOIN package_usage_type AS put ON ipk.id = put.package_id
            LEFT JOIN car_usage_type AS cut ON put.car_usage_type_id = cut.id
            LEFT JOIN car_type AS ct ON cut.car_type_id = ct.id
            GROUP BY 
                ipm.id,
                ipm.premium_name,
                ipm.repair_fund_int,
                ipm.repair_fund_max,
                ipm.start_year,
                ipm.max_year,
                ipm.car_lost_fire,
                ipm.total_premium,
                ipm.net_income,
                ipm.selling_price,
                ipk.package_name,
                ipk.package_id,
                icp.namecompany,
                it.nametype,
                ipk.start_date,
                ipk.end_date
            ORDER BY ${sortKey} ${validSortDirection} 
            LIMIT $1 OFFSET $2
            `
            , [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM insurance_premium')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.searchPremium = async(req, res) => {
    try {
        const { search } = req.body;

        const result = await db.query(
            `
                ${GET_LIST_PREMIUM}  
                WHERE
                    ipm.premium_id ILIKE $1 OR
                    ipm.premium_name ILIKE $1 OR
                    icp.namecompany ILIKE $1 OR
                    it.nametype ILIKE $1
                GROUP BY 
                    ipm.id,
                    ipk.package_name,
                    ipk.package_id,
                    icp.namecompany,
                    it.nametype,
                    ipk.start_date,
                    ipk.end_date
                ORDER BY ipm.id DESC
            `
            , [`%${search}%`]
        );

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.isActivePremium = async(req, res) => {
    try {
            const { is_active } = req.body
            const { id } = req.params

            await db.query('UPDATE insurance_premium SET is_active = $1 WHERE id = $2', 
            [is_active, id])

        res.json({msg: 'อัปเดตสถานะเบี้ยสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const result = await db.query(
            `
            SELECT 
                ipm.package_id,
                ipm.premium_discount,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'premium_name', ipm.premium_name,
                            'repair_fund_int', ipm.repair_fund_int,
                            'repair_fund_max', ipm.repair_fund_max,
                            'start_year', ipm.start_year,
                            'max_year', ipm.max_year,
                            'car_lost_fire', ipm.car_lost_fire,
                            'total_premium', ipm.total_premium,
                            'net_income', ipm.net_income,
                            'selling_price', ipm.selling_price
                        )
                    ) FILTER (WHERE ipm.id IS NOT NULL),
                    '[]'::jsonb
                ) AS premiums
            FROM insurance_premium AS ipm
            WHERE ipm.id = $1
            GROUP BY ipm.package_id, ipm.premium_discount
            `, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const { package_id, premium_discount, premiums } = req.body

    try {
        const result = await db.query('SELECT * FROM  insurance_premium WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        for(const p of premiums) {
            const columns = [...Object.keys(p), 'package_id', 'premium_discount']
            const values = [...Object.values(p), package_id, premium_discount]

            const setClauses = columns.map((col, idx) => `${col} = $${idx + 1}`)

            const updatePremiumSql = `
                UPDATE insurance_premium 
                SET ${setClauses.join(', ')}
                WHERE id = $${columns.length + 1}
            `

            await db.query(updatePremiumSql, [...values, id])
        }

        res.json({msg: 'อัปเดตข้อมูลเบี้ยประกันสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
         const {id} = req.params

         await db.query('DELETE FROM insurance_premium WHERE id = $1', [id])

         res.json({msg: 'ลบข้อมูลเบี้ยประกันสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.searchPremiumToCompare = async(req, res) => {
    try {
        const { insurance_type_id, car_type_id, car_usage_id } = req.body;

        // ตรวจสอบว่าเลือกครบหรือไม่เลือกเลย
        const hasAllFilters = insurance_type_id && car_type_id && car_usage_id
        const hasNoFilters = !insurance_type_id && !car_type_id && !car_usage_id

        // ถ้าเลือกไม่ครบทั้ง 3 ให้ return error
        if (!hasAllFilters && !hasNoFilters) {
            return res.status(400).json({ 
                message: 'กรุณาเลือกข้อมูลให้ครบทั้ง 3 รายการ หรือไม่เลือกเลย' 
            })
        }

        let query = `
             select distinct
              ipm.id as index_premium,
              ipm.premium_id,
              icp.id as index_package,
              icp.id as index_company,
              icp.logo_url,
              icp.namecompany,
              ipk.package_id,
              ipk.package_name,
              it.nametype,
              ipm.repair_fund_max,
              ipk.additional_medical_expense_cover,
              ipm.total_premium,
              ipm.net_income,
              ipm.selling_price,
              ipm.premium_discount
            from
              insurance_premium as ipm
              inner join insurance_package as ipk on ipm.package_id = ipk.id
              inner join insurance_company as icp on ipk.insurance_company = icp.id
              inner join insurance_type as it on ipk.insurance_type = it.id
        `

        let whereClause = 'where ipk.is_active = true'
        let values = []

        if(hasAllFilters){
            query += `
              inner join package_usage_type as put on ipk.id = put.package_id
              inner join car_usage_type as cut on put.car_usage_type_id = cut.id
            `

            values = [car_usage_id, car_type_id, insurance_type_id]
            whereClause += `
                and cut.car_usage_id = $1 
                and cut.car_type_id = $2
                and ipk.insurance_type = $3 
            `
        }

        query += `${whereClause} order by ipm.id asc`

        console.log('Query:', query)
        console.log('Values:', values)

        const result = await db.query(query, values)

        if(result.rows.length === 0){
            return res.status(404).json({message : 'ไม่พบข้อมูลเบี้ย'})
        }

        res.json({data : result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.createPremiumToCompare = async(req, res) => {
    const client = await db.connect()

    try {
        const {
            to_name, 
            details, 
            car_brand_id, 
            car_model_id, 
            car_year_id, 
            car_usage_id, 
            offer_id, 
            sub_car_model, 
            import_by, 
            premiums
        } = req.body

        // Validation
        if (!premiums || premiums.length < 3) {
            return res.status(400).json({ message: 'กรุณาเลือกแพ็กเกจให้ครบ 3 รายการ' })
        }

        if (premiums.length > 3) {
            return res.status(400).json({ message: 'เลือกได้สูงสุด 3 รายการเท่านั้น' })
        }

        //1. สร้างใบเสอนราคาที่ quotation compare
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const yearMonth = `${year}${month}`

       //2. insert พร้อมข้อมูลรถ และเอา id ออกมา
        const insertResult = await client.query(
            `INSERT INTO quotation_compare(
                to_name, details, car_brand_id, car_model_id, car_year_id, car_usage_id, offer_id, sub_car_model, import_by
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id`,
            [
                to_name || null,
                details || null,
                car_brand_id ? Number(car_brand_id) : null,
                car_model_id ? Number(car_model_id) : null,
                car_year_id ? Number(car_year_id) : null,
                car_usage_id ? Number(car_usage_id) : null,
                Number(offer_id),
                sub_car_model || null,
                import_by
            ]
        )

        const compareId  = insertResult.rows[0].id
        const runningNumber = String(compareId ).padStart(6, '0')
        const q_id = `Q${yearMonth}${runningNumber}`

        //3. update q_id
        await client.query(
            `UPDATE quotation_compare SET q_id = $1 WHERE id = $2`,
            [q_id, compareId ]
        )

        //4. ลูปสร้าง quotation กับ quotaion field
        for(let i = 0; i < premiums.length; i++) {

            //ได้ข้อมูลเป็น object premium ของตำแหน่งรอบที่วน 
            const p = premiums[i]
            const { index_company, index_package, index_premium } = p

            // Validate index values
            if (!index_company || !index_premium) {
                throw new Error(`ข้อมูล premium ที่ ${i + 1} ไม่ครบถ้วน`)
            }

            // สร้าง document_id
            const document_id = `${q_id}-${String(i + 1)}`

            // สร้าง quotation
            const quotationResult = await client.query('INSERT INTO quotation(company_id, compare_id, doc_id) VALUES ($1, $2, $3) RETURNING id',
                [ Number(index_company), q_id, document_id ]
            )

            const quotation_id = quotationResult.rows[0].id

            //ดึงข้อมูลที่ใช้ในการบันทึกลง quotaion field
            const resultPremium = await client.query(
                `
                    select
                      ipm.premium_id,
                      ipm.premium_name,
                      ipm.car_lost_fire as car_fire_theft ,
                      ipm.selling_price as premium_total,
                      it.nametype as insurance_type,
                      ipk.repair_type,
                      ipk.package_id,
                      ipk.car_own_damage_deductible,
                      ipk.thirdparty_injury_death_per_person,
                      ipk.thirdparty_injury_death_per_accident,
                      ipk.thirdparty_property,
                      ipk.additional_personal_permanent_driver_cover,
                      ipk.additional_medical_expense_cover,
                      ipk.additional_bail_bond,
                      ipk.additional_personal_permanent_driver_number
                    from
                      insurance_premium as ipm
                      inner join insurance_package as ipk on ipm.package_id = ipk.id
                      inner join insurance_type as it on ipk.insurance_type = it.id
                    where
                      ipm.id = $1
                `
                , [Number(index_premium)])

            if (resultPremium.rows.length === 0) {
                throw new Error(`ไม่พบข้อมูล premium id: ${index_premium}`)
            }

                //ได้ object มาก่อนหนึ่ง
            const premiumData = resultPremium.rows[0]

            // บันทึกแต่ละ field แยกเป็น row
            for (const [key, value] of Object.entries(premiumData)) {
                // แปลงค่าเป็น string สำหรับบันทึก
                const fieldValue = value !== null && value !== undefined 
                    ? String(value) 
                    : null

                await client.query(
                    `INSERT INTO quotation_field (quotation_id, field_code, field_value) 
                     VALUES ($1, $2, $3)`,
                    [quotation_id, key, fieldValue]
                )
            }
        }

        await client.query('COMMIT')

        res.json({msg: 'สร้างใบเสนอราคาจากแพ็กเกจสำเร็จ'})
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('Error creating quotation:', err)
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา',
            error: err.message 
        })
    } finally {
        client.release()
    }
}