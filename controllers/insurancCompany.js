const connection = require('../config/database');

exports.create = async(req, res) => {
    const { nameCompany, code, logo_url, phone, logo_public_id } = req.body
    try {
        const query = 'INSERT INTO insurance_company(nameCompany, code, logo_url, phone, logo_public_id) VALUES(?, ?, ?, ?, ?)';

        await connection.query(query, [nameCompany, code, logo_url, phone, logo_public_id])

        res.json({ msg: 'เพิ่มข้อมูลบริษัทสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const company = await connection.query('SELECT id, nameCompany, logo_url, code, phone, logo_public_id FROM insurance_company')

        res.json({ data: company[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const company = await connection.query('SELECT id, nameCompany FROM insurance_company')

        res.json({ data: company[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, nameCompany, code, logo_url, phone, logo_public_id FROM insurance.insurance_company WHERE id = ?'
        const [row] = await connection.query(query, [parseInt(id)])

         res.json({ data: row[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {nameCompany, code, logo_url, phone} = req.body

    try {
        const [rows] = await connection.query('SELECT * FROM  insurance_company WHERE id = ?',[id])

        await connection.query('UPDATE insurance_company SET nameCompany = ?, code = ?, logo_url = ?, phone = ? WHERE id = ?', 
            [
                nameCompany     || rows[0].nameCompany,
                code            || rows[0].code,
                logo_url        || rows[0].logo_url,
                phone           || rows[0].phone,
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

        await connection.query('DELETE FROM insurance_company WHERE id = ?', [id])

        res.json({message: 'ลบข้อมูลบริษัทสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}