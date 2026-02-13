const db = require('../config/database')
const cloudinary = require('../config/cloudinary')

exports.create = async(req, res) => {
    const { namecompany, code, logo_url, phone, logo_public_id } = req.body
    try {
        const query = 'INSERT INTO insurance_company(namecompany, code, logo_url, phone, logo_public_id, is_active) VALUES($1, $2, $3, $4, $5, true)';

        await db.query(query, [namecompany, code, logo_url, phone, logo_public_id])

        res.json({ msg: 'เพิ่มข้อมูลบริษัทสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
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

        const allowedSortKeys = [
            'id',
            'namecompany',
            'code',
            'phone'
        ]

        const pageNum = parseInt(page, 10)
        const limitNum = parseInt(limit, 10)
        const offset = (pageNum - 1) * limitNum
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const finalSortKey = allowedSortKeys.includes(sortKey)
            ? sortKey
            : 'id'

        let conditions = [];
        let values = [];
        let paramIndex = 1;

        if (search) {
            conditions.push(`
                (
                namecompany ILIKE $${paramIndex}
                OR code ILIKE $${paramIndex}
                OR phone ILIKE $${paramIndex}
                )
            `);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const countResult = await db.query(`SELECT COUNT(*)::int as total FROM insurance_company ${whereClause}`, values)

        const totalItems = countResult.rows[0].total
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(
            `
            SELECT id, namecompany, logo_url, code, phone, logo_public_id, is_active 
            FROM insurance_company 
            ${whereClause} 
            ORDER BY ${finalSortKey} ${validSortDirection} 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `, [...values, limitNum, offset])


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

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, logo_url, namecompany FROM insurance_company WHERE is_active = true')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listCompanyTheme = async(req, res) => {
    try {
        const result = await db.query(
            `
            select distinct  ic.id, ic.logo_url, ic.namecompany 
            from company_theme as ct 
            left join insurance_company as ic on ct.company_id = ic.id
            `)

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, namecompany, code, logo_url, phone, logo_public_id FROM insurance_company WHERE id = $1'

        const result  = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {namecompany, code, logo_url, phone} = req.body

    try {
        const result = await db.query('SELECT * FROM  insurance_company WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]


        await db.query('UPDATE insurance_company SET namecompany = $1, code = $2, logo_url = $3, phone = $4 WHERE id = $5', 
            [
                namecompany     ?? old.namecompany,
                code            ?? old.code,
                logo_url        ?? old.logo_url,
                phone           ?? old.phone,
                id
            ])

        res.json({msg: 'อัปเดตข้อมูลบริษัทประกันสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.is_active = async(req, res) => {
    try {
            const { is_active } = req.body
            const { id } = req.params

            await db.query('UPDATE insurance_company SET is_active = $1 WHERE id = $2', 
            [is_active, id])

        res.json({msg: 'อัปเดตสถานะสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.remove = async(req, res) => {
    const {id} = req.params

    try {
        //1 ใช้ไอดีที่ได้มาหาข้อมูล
        const result = await db.query('SELECT * FROM insurance_company WHERE id = $1', [id])

        if(result.rows.length === 0){
            return res.status(404).json({msg: 'ไม่เจอบริษัทนี้'})
        }

        const {logo_public_id} = result.rows[0]

        //2 ถ้ามี logo_public_id ให้ลบรูปก่อน
        if(logo_public_id){
            await cloudinary.uploader.destroy(logo_public_id)
        }
        
        //3 ลบบริษัท
        await db.query('DELETE FROM insurance_company WHERE id = $1', [id])

        res.json({msg: 'ลบข้อมูลบริษัทสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}