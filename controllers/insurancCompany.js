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
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.per_page) || 5;

    const offset = (page - 1) * per_page

    try {
        const result = await db.query('SELECT id, namecompany, logo_url, code, phone, logo_public_id, is_active FROM insurance_company ORDER BY id ASC LIMIT $1 OFFSET $2', [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM insurance_company')

        res.json({ data: result.rows, total: countResult.rows[0].total })
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