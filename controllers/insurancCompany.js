const db = require('../config/database')

exports.create = async(req, res) => {
    const { nameCompany, code, logo_url, phone, logo_public_id } = req.body
    try {
        const query = 'INSERT INTO insurance_company(namecompany, code, logo_url, phone, logo_public_id) VALUES($1, $2, $3, $4, $5)';

        await db.query(query, [nameCompany, code, logo_url, phone, logo_public_id])

        res.json({ msg: 'เพิ่มข้อมูลบริษัทสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const result = await db.query('SELECT id, namecompany, logo_url, code, phone, logo_public_id FROM insurance_company')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, namecompany FROM insurance_company')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, namecompany, code, logo_url, phone, logo_public_id FROM insurance.insurance_company WHERE id = $1'

        const result  = await db.query(query, [parseInt(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {nameCompany, code, logo_url, phone} = req.body

    try {
        const result = await db.query('SELECT * FROM  insurance_company WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]


        await db.query('UPDATE insurance_company SET namecompany = $1, code = $2, logo_url = $3, phone = $4 WHERE id = $5', 
            [
                nameCompany     ?? old.nameCompany,
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

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM insurance_company WHERE id = $1', [id])

        res.json({message: 'ลบข้อมูลบริษัทสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}