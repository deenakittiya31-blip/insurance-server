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
            LEFT JOIN insurance_company AS icp ON ipk.insurance_company_id = icp.id 
            LEFT JOIN insurance_type AS it ON ipk.insurance_type_id = it.id 

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

        console.log(insurance_type_id, car_type_id, car_usage_id)

        const result = await db.query(
            `
            select distinct
              ipm.id as index_premium,
              ipm.premium_id,
              icp.id as index_package,
              icp.logo_url,
              icp.namecompany,
              ipk.package_id,
              ipk.package_name,
              it.nametype,
              ipm.repair_fund_max,
              ipk.medical_expense,
              ipm.total_premium,
              ipm.net_income,
              ipm.selling_price,
              ipm.premium_discount
            from
              insurance_premium as ipm
              left join insurance_package as ipk on ipm.package_id = ipk.id
              left join insurance_company as icp on ipk.insurance_company_id = icp.id
              left join insurance_type as it on ipk.insurance_type_id = it.id
              left join package_usage_type as put on ipk.id = put.package_id
              left join car_usage_type as cut on put.car_usage_type_id = cut.id
            WHERE 
              cut.car_usage_id = $1 
              AND cut.car_type_id = $2 
              AND ipk.insurance_type_id = $3
              AND ipk.is_active = true
            order by ipm.id asc

            `
            ,[ car_usage_id, car_type_id, insurance_type_id ]
        )

        res.json({data : result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}