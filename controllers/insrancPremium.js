const db = require('../config/database')

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

            const premiumCode = `PM${String(nextNumber).padStart(11, '0')}`;

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

    const offset = (page - 1) * per_page

    try {
        const result = await db.query(
            `
           SELECT 
                ipm.*, 
                ipk.package_name,
                ipk.package_id,
                icp.namecompany,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'code_type', ct.code
                        )
                    ) FILTER (WHERE ct.id IS NOT NULL),
                    '[]'::jsonb
                ) AS type,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'name_type', ct.type
                        )
                    ) FILTER (WHERE ct.id IS NOT NULL),
                    '[]'::jsonb
                ) AS name_type
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
                icp.namecompany
            ORDER BY ipm.id DESC
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

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, package_id, car_usage_id, car_year, premium_price, compulsory_price FROM insurance_premium WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {package_id, car_usage_id, car_year, premium_price, compulsory_price} = req.body

    try {
        const result = await db.query('SELECT * FROM  insurance_premium WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]

        await db.query('UPDATE  insurance_premium SET package_id = $1, car_usage_id = $2, car_year = $3, premium_price = $4, compulsory_price = $5  WHERE id = $6', 
            [
               package_id         !== undefined ? Number(package_id) :  old.package_id,
               car_usage_id       !== undefined ? Number(car_usage_id) :  old.car_usage_id,
               car_year           !== undefined ? Number(car_year) :  old.car_year,
               premium_price      !== undefined ? Number(premium_price) :  old.premium_price,
               compulsory_price   !== undefined ? Number(compulsory_price) :  old.compulsory_price,
               id
            ])

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