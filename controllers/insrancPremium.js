const db = require('../config/database')
const { createQuotationCompare } = require('../services/createQuotationCompare')
const { processPremiums } = require('../services/processPremiums')
const { validatePremiums } = require('../services/validatePremiums')

exports.create = async(req, res) => {
    const client = await db.connect()

    try {
        await client.query('BEGIN')

        const { package_id, premium_discount, premiums } = req.body

        // แปลง "" เป็น null
        const cleanDiscount = premium_discount === '' ? null : premium_discount

        for(const p of premiums){

            // แปลงทุก field ใน premiumData ที่เป็น "" → null
            const cleanedData = Object.fromEntries(
                Object.entries(p).map(([key, val]) => [
                    key,
                    val === '' ? null : val
                ])
            )

            const result = await client.query(`
                SELECT premium_id
                FROM insurance_premium
                ORDER BY id DESC
                LIMIT 1
                FOR UPDATE
            `);

            //เจนรหัสเบี้ยประกัน
            let nextNumber = 1;
            if (result.rows.length) {
                const lastCode = result.rows[0].premium_id; // PM00000000012
                const lastNumber = parseInt(lastCode.replace('PM', ''), 10);
                nextNumber = lastNumber + 1;
            }

            const premiumCode = `PM${String(nextNumber).padStart(5, '0')}`;

            const columns = [...Object.keys(cleanedData), 'premium_id', 'package_id', 'premium_discount']
            const values = [...Object.values(cleanedData), premiumCode, package_id, cleanDiscount]
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
    try {
        const {
            page = 1,
            limit = 10,
            sortKey = 'id',
            sortDirection = 'DESC',
            search
        } = req.query;

        const sortColumnMap = {

            premium_id: 'ipm.premium_id',
            premium_name: 'ipm.premium_name',
            nametype: 'it.nametype',
            namecompany: 'icp.namecompany',
            code_type: 'ct.code',
            start_date: 'ip.start_date',
            total_premium: 'ipm.total_premium',
            net_income: 'ipm.net_income',
            selling_price: 'ipm.selling_price',
        };

        const pageNum = parseInt(page, 10)
        const limitNum = parseInt(limit, 10)
        const offset = (pageNum - 1) * limitNum
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const finalSortKey = sortColumnMap[sortKey] || 'ipm.premium_id';

        let conditions = [];
        let values = [];
        let paramIndex = 1;

        if (search) {
            conditions.push(`
                (
                ipk.package_id ILIKE $${paramIndex}
                OR ipk.package_name ILIKE $${paramIndex}
                OR TO_CHAR(ipk.start_date, 'DD/MM/YYYY') ILIKE $${paramIndex} 
                OR TO_CHAR(ipk.end_date, 'DD/MM/YYYY') ILIKE $${paramIndex} 
                OR ipk.repair_type ILIKE $${paramIndex} 
                OR icp.namecompany ILIKE $${paramIndex}
                OR it.nametype ILIKE $${paramIndex} 
                OR ct.code ILIKE $${paramIndex} 
                OR ipm.premium_name ILIKE $${paramIndex}
                OR ipm.premium_discount::text ILIKE $${paramIndex}
                OR ipm.repair_fund_int::text ILIKE $${paramIndex}
                OR ipm.repair_fund_max::text ILIKE $${paramIndex}
                OR ipm.start_year ILIKE $${paramIndex}
                OR ipm.max_year ILIKE $${paramIndex}
                OR ipm.car_lost_fire::text ILIKE $${paramIndex}
                OR ipm.net_income::text ILIKE $${paramIndex}
                OR ipm.total_premium::text ILIKE $${paramIndex}
                OR ipm.premium_id ILIKE $${paramIndex}
                OR ipm.selling_price::text ILIKE $${paramIndex}
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
            SELECT COUNT(DISTINCT ipm.id)::int as total
            FROM insurance_premium AS ipm
            LEFT JOIN insurance_package AS ipk ON ipm.package_id = ipk.id 
            LEFT JOIN insurance_company AS icp ON ipk.insurance_company = icp.id 
            LEFT JOIN insurance_type AS it ON ipk.insurance_type = it.id 
            LEFT JOIN package_usage_type AS put ON ipk.id = put.package_id
            LEFT JOIN car_usage_type AS cut ON put.car_usage_type_id = cut.id
            LEFT JOIN car_type AS ct ON cut.car_type_id = ct.id
            ${whereClause}
            `, values)

        const totalItems = countResult.rows[0].total
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(
            `
           SELECT 
                ipm.id,
                ipm.premium_id,
                ipk.package_id,
                ipm.premium_name,
                icp.namecompany,
                it.nametype,
                ipm.total_premium,
                ipm.is_active,
                ipm.net_income,
                ipm.selling_price,
                ipk.start_date,
                ipk.end_date,
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
            ${whereClause} 
            GROUP BY 
                ipm.id,
                ipm.premium_id,
                ipk.package_id,
                ipm.premium_name,
                icp.namecompany,
                it.nametype,
                ipm.total_premium,
                ipm.net_income,
                ipm.selling_price,
                ipk.start_date,
                ipk.end_date
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

//ฟังก์ชันดึงข้อมูลเบี้ยประกันของลูกค้า
exports.searchPremiumMember = async(req, res) => {
    try {
        const { insurance_type_id, insurance_company,  car_usage_type_id, repair_type, group_code } = req.body;

        // ตรวจสอบว่าเลือกครบหรือไม่เลือกเลย
        const hasFilter = insurance_type_id || car_usage_type_id || 
                         (insurance_company && insurance_company.length > 0) || repair_type

        if (!hasFilter) {
            return res.status(400).json({ message: 'กรุณาระบุเงื่อนไขการค้นหาอย่างน้อย 1 รายการ' })
        }

        if (!car_usage_type_id) {
            return res.status(400).json({ message: 'กรุณาระบุประเภทรถยนต์' })
        }

        let values = [];
        let conditions = [];
        let index = 1;

        values.push(group_code || null);
        const groupCodeIndex = index; // = 1
        index++;

        let query = `
            select
                ipm.id AS index_premium,
                icp.id AS index_company,
                ipk.id AS index_package,
                ipm.premium_name,
                icp.logo_url,
                icp.namecompany,
                it.nametype,
                ipk.repair_type,
                pmt.promotion_name,
                pmt.logo_url promotion_img,
                ipm.total_premium,
                ipm.repair_fund_int,
                ipm.net_income,
                ipm.selling_price,
                ipm.premium_discount,
                ipk.car_own_damage_deductible,
                ipk.thirdparty_property,
                ipk.additional_personal_permanent_driver_number,

                -- ส่วนลดเลเวลของลูกค้าคนนี้ (ใช้คำนวณ selling_price_final)
                COALESCE(pp_cash.discount_percent, 0) as payment_discount_percent,
                COALESCE(pp_cash.discount_amount, 0) as payment_discount_amount,
                -- ส่วนลดเลเวลของลูกค้าคนนี้
                COALESCE(pgd.discount_percent, 0) as level_discount_percent,

                COALESCE(
                    (
                        SELECT JSONB_AGG(
                            JSONB_BUILD_OBJECT(
                                'payment_method_id', ipp.payment_method_id,
                                'payment_name',      pm.name_payment,
                                'discount_percent',  ipp.discount_percent,
                                'discount_amount',   ipp.discount_amount,
                                'first_payment_amount', ipp.first_payment_amount,
                                'charge',            ipp.charge,
                                'installment_min',   ipp.installment_min,
                                'installment_max',   ipp.installment_max
                            )
                        )
                        FROM package_payment ipp
                        JOIN payment_methods pm ON ipp.payment_method_id = pm.id
                        WHERE ipp.package_id = ipk.id
                    ),
                    '[]'::jsonb
                ) AS payments,

                JSONB_BUILD_OBJECT(
                    'group_name', gm.group_name,
                    'discount_percent', pgd.discount_percent
                ) AS group_discount,

                JSONB_BUILD_OBJECT(
                    'car_own_damage_deductible', ipk.car_own_damage_deductible,
                    'car_own_damage', ipk.car_own_damage,
                    'car_lost_fire', ipm.car_lost_fire
                ) AS car_protect,

                JSONB_BUILD_OBJECT(
                    'thirdparty_injury_death_per_person', ipk.thirdparty_injury_death_per_person,
                    'thirdparty_injury_death_per_accident', ipk.thirdparty_injury_death_per_accident,
                    'thirdparty_property', ipk.thirdparty_property
                ) AS third_protect,

                JSONB_BUILD_OBJECT(
                    'additional_personal_permanent_driver_cover', ipk.additional_personal_permanent_driver_cover,
                    'additional_medical_expense_cover', ipk.additional_medical_expense_cover,
                    'additional_bail_bond', ipk.additional_bail_bond
                ) AS additional_protect

            FROM insurance_premium ipm
            JOIN insurance_package ipk ON ipm.package_id = ipk.id
            JOIN promotion pmt ON ipk.promotion_id = pmt.id
            JOIN insurance_company icp ON ipk.insurance_company = icp.id
            JOIN insurance_type it ON ipk.insurance_type = it.id
            LEFT JOIN package_usage_type pcut ON ipk.id = pcut.package_id

            LEFT JOIN (
                SELECT
                ipp.package_id,
                ARRAY_AGG(distinct pm.id) AS payments
                from
                package_payment ipp
                join payment_methods pm ON ipp.payment_method_id = pm.id
                GROUP BY
                ipp.package_id
            ) pp ON ipk.id = pp.package_id

            -- join ส่วนลดเงินสด (ใช้คำนวณ)
            LEFT JOIN package_payment pp_cash ON ipk.id = pp_cash.package_id
            AND pp_cash.payment_method_id = 1

            -- join ส่วนลดเลเวลลูกค้า (ใช้คำนวณ)
            LEFT JOIN package_group_discount pgd ON ipk.id = pgd.package_id
            AND pgd.group_code = $${groupCodeIndex}
            LEFT JOIN group_member gm ON pgd.group_code = gm.group_code
        `;

        //เงื่อนไขพื้นฐาน (ต้องมีเสมอ)
        conditions.push(`ipk.is_active = true`);
        conditions.push(`ipm.is_active = true`);

        //filter insurance_type_id
        if (insurance_type_id) {
            conditions.push(`ipk.insurance_type = $${index}`);
            values.push(insurance_type_id);
            index++;
        }

        //filter car_usage_id
        if (car_usage_type_id) {
            conditions.push(`pcut.car_usage_type_id = $${index}`);
            values.push(car_usage_type_id);
            index++;
        }

        //filter insurance_company (array)
        if (insurance_company && insurance_company.length > 0) {
            conditions.push(`ipk.insurance_company = ANY($${index})`);
            values.push(insurance_company);
            index++;
        }

        //filter repair_type
        if (repair_type) {
            conditions.push(`ipk.repair_type ILIKE $${index}`);
            values.push(`%${repair_type}%`);
            index++;
        }

        // ---------------------------
        // รวม where clause
        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        console.log("Query:", query);
        console.log("Values:", values);

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(200).json({ data: [], total: 0, message: 'ไม่พบข้อมูลเบี้ย' })
        }


        // คำนวณ selling_price_final
        const data = result.rows.map(row => {
            const premium      = parseFloat(row.total_premium) || 0
            const net_total    = premium * 0.9309
            const premium_discount        = (parseFloat(row.premium_discount) || 0) / 100
            const level_discount_percent  = (parseFloat(row.level_discount_percent) || 0) / 100
            const payment_discount_percent = (parseFloat(row.payment_discount_percent) || 0) / 100
            const payment_discount_amount = parseFloat(row.payment_discount_amount) || 0


            const selling_price_final = (
                premium - (
                    (net_total * (premium_discount + level_discount_percent + payment_discount_percent))
                    + payment_discount_amount
                )
            ).toFixed(2)

            return {
                ...row,
                selling_price_final,
            }
        })

        res.json({ 
            data,
            total: data.length
         });
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

//ฟังก์ชันสร้างใบเสนอราคาของลูกค้า
exports.createPremiumToCompareMember = async(req, res) => {
    const client = await db.connect()
    try {
        await client.query('BEGIN')
        const { insurance_type_id, insurance_company, car_usage_type_id, repair_type, premiums, ...compareData } = req.body
        const member_id = req.user.id


        validatePremiums(premiums)

        const q_id = await createQuotationCompare(client, compareData)

        //เก็บข้อมูลการกรองของลูกค้า
        await client.query(
            `
            insert into filter_premium_member (insurance_type_id, insurance_company, car_usage_type_id, repair_type, compare_id)
            values ($1, $2, $3, $4, $5)`
            , [
                insurance_type_id ? Number(insurance_type_id) : null,
                insurance_company?.length > 0 ? insurance_company.map(Number) : null, //array of int
                car_usage_type_id ? Number(car_usage_type_id) : null,
                repair_type || null,
                q_id
              ]
        )

        await processPremiums(client, premiums, q_id, {saveToCart: true}, member_id)

        await client.query('COMMIT')

        res.json({ compare_id: q_id })
    } catch (err) {
        await client.query('ROLLBACK')
        //เพราะ validatePremiums ใช้ throw แล้ว
        res.status(err.statusCode || 500).json({ message: err.message })
    } finally {
        client.release()
    }
}

//ดึงข้อมูลทำ preview ให้ลูกค้าดู
exports.previewCompare = async(req, res) => {
    try {
        const { id } = req.params

        const premiumResult = await db.query(
            `
            SELECT
                poc.compare_id,

                -- premium
                ipm.id AS index_premium,
                ipm.selling_price,
                ipm.car_lost_fire,
                ipm.repair_fund_int,

                -- package
                ipk.id AS index_package,
                ipk.repair_type,
                ipk.car_own_damage,
                ipk.car_own_damage_deductible,
                ipk.thirdparty_injury_death_per_person,
                ipk.thirdparty_injury_death_per_accident,
                ipk.thirdparty_property,
                ipk.additional_medical_expense_cover,
                ipk.additional_bail_bond,
                ipk.additional_personal_permanent_driver_number,
                ipk.additional_personal_permanent_driver_cover,

                -- company
                icp.logo_url,

                -- type
                it.nametype AS insurance_type

            FROM premium_on_cart poc
            JOIN insurance_premium ipm 
                ON poc.premium_id = ipm.id
            JOIN insurance_package ipk 
                ON poc.package_id = ipk.id
            JOIN insurance_company icp 
                ON ipk.insurance_company = icp.id
            JOIN insurance_type it 
                ON ipk.insurance_type = it.id
            WHERE poc.compare_id = $1
            ORDER BY poc.id ASC
            `, [id]
        )

        if (premiumResult.rows.length === 0) {
            return res.status(404).json({
                message: 'ไม่พบข้อมูลเปรียบเทียบ'
            })
        }

        res.json({
            compare_id: id,
            plans: premiumResult.rows.map(p => ({
                premium: {
                    id: p.index_premium,
                    price: p.selling_price,
                    logo: p.logo_url,
                    type: p.insurance_type,
                    index_premium: p.index_premium,
                    index_package: p.index_package,
                },
                coverage: {
                    total_premium: p.repair_fund_int,
                    repair: p.repair_type,
                    deductible: p.car_own_damage_deductible,
                    car_own_damage: p.car_own_damage,
                    car_lost_fire: p.car_lost_fire,
                    medical: p.additional_medical_expense_cover,
                    bail_bond: p.additional_bail_bond,
                    driver_number: p.additional_personal_permanent_driver_number,
                    driver_cover: p.additional_personal_permanent_driver_cover,
                    driver_cover: p.additional_personal_permanent_driver_cover,
                    driver_cover: p.additional_personal_permanent_driver_cover,
                    driver_cover: p.additional_personal_permanent_driver_cover,
                    third_person: p.thirdparty_injury_death_per_person,
                    third_accident: p.thirdparty_injury_death_per_accident,
                    third_prop: p.thirdparty_property
                }
            }))
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

exports.listPremiumCart = async(req, res) => {
    try {
        const member_id = req.user.id

        const premiumResult = await db.query(
            `
            select
                poc.id as cart_id,
                poc.compare_id,
                -- premium
                ipm.id as index_premium,
                ipm.selling_price,
                ipm.premium_name,
                -- package
                ipk.id as index_package,
                ipk.repair_type,
                ipk.package_name,
                -- company
                icp.logo_url,
                -- type
                it.nametype as insurance_type,
                -- have on order
                exists (
                    select
                    1
                    from
                    premium_on_order poo
                    where
                    poo.premium_id = poc.premium_id
                    and poo.member_id = poc.member_id
                ) as is_ordered,
                -- filter premium 
                fpm.repair_type as filter_repair_type,
                fit.nametype as filter_insurance_type,
                ct.type as filter_car_type, 
                cu.usage_name as filter_car_usage
            from
                premium_on_cart poc
            join insurance_premium ipm on poc.premium_id = ipm.id
            join insurance_package ipk on poc.package_id = ipk.id
            join insurance_company icp on ipk.insurance_company = icp.id
            join insurance_type it on ipk.insurance_type = it.id
            left join filter_premium_member fpm on poc.compare_id = fpm.compare_id
            left join insurance_type fit on fpm.insurance_type_id = fit.id
            left join car_usage_type cut on fpm.car_usage_type_id = cut.id
            left join car_type ct on cut.car_type_id = ct.id
            left join car_usage cu on cut.car_usage_id = cu.id
            where
                poc.member_id = $1
            order by
                poc.id desc
            `, [member_id]
        )

        if (premiumResult.rows.length === 0) {
            return res.status(200).json({
                data: [],
                message: 'ไม่พบข้อมูลเปรียบเทียบ'
            })
        }


        const grouped = {}

        premiumResult.rows.forEach(p => {
            const cid = p.compare_id

            if (!grouped[cid]) {
                grouped[cid] = {
                    compare_id: cid,
                    filter: {
                        repair_type: p.filter_repair_type,
                        insurance_type: p.filter_insurance_type,
                        car_type: p.filter_car_type,
                        car_usage: p.filter_car_usage
                    },
                    premiums: []
                }
            }

            grouped[cid].premiums.push({
                cart_id: p.cart_id,
                index_premium: p.index_premium,
                selling_price: p.selling_price,
                premium_name: p.premium_name,
                index_package: p.index_package,
                repair_type: p.repair_type,
                package_name: p.package_name,
                logo_url: p.logo_url,
                insurance_type: p.insurance_type,
                is_ordered: p.is_ordered
            })
        })

        res.json({ data: Object.values(grouped) })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
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
        const { insurance_type_id, car_type_id, car_usage_id, repair_type } = req.body;

        // ตรวจสอบว่าเลือกครบหรือไม่เลือกเลย
        const hasAllFilters = insurance_type_id && car_type_id && car_usage_id
        const hasNoFilters = !insurance_type_id && !car_type_id && !car_usage_id

        console.log(repair_type)

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

        let whereClause = 'where ipk.is_active = true and ipm.is_active = true'
        let values = []

        if(hasAllFilters){
            query += `
              inner join package_usage_type as put on ipk.id = put.package_id
              inner join car_usage_type as cut on put.car_usage_type_id = cut.id
            `

            values = [car_usage_id, car_type_id, insurance_type_id, `%${repair_type}%`]
            whereClause += `
                and cut.car_usage_id = $1 
                and cut.car_type_id = $2
                and ipk.insurance_type = $3 
                and ipk.repair_type ILIKE $4
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
        await client.query('BEGIN')
        
        const { premiums, ...compareData } = req.body

        validatePremiums(premiums)

        const q_id = await createQuotationCompare(client, compareData)

        await processPremiums(client, premiums, q_id, {})

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