const connection = require('../config/database');

exports.create = async(req, res) => {
    try {
        const { nameType, description } = req.body

        const query = 'INSERT INTO insurance_type(nameType, description) VALUES(?, ?)';

        await connection.query(query, [nameType, description])
        res.json({ msg: 'เพิ่มข้อมูลสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const company = await connection.query('SELECT id, nameType, description FROM insurance_type')

        res.json({ data: company[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const company = await connection.query('SELECT id, nameType FROM insurance_type')

        res.json({ data: company[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    const {id} = req.params

    try {
         const query = 'SELECT id, nameType, description FROM insurance.insurance_type WHERE id = ?'
        const [row] = await connection.query(query, [parseInt(id)])

         res.json({ data: row[0] })
    } catch (err) {
         console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const { nameType, description } = req.body;

    try {
        const [rows] = await connection.query('SELECT * FROM  insurance_type WHERE id = ?',[id])

        await connection.query('UPDATE insurance_type SET nameType = ?, description=? WHERE id = ?', 
            [
                nameType        || rows[0].nameType, 
                description     ||rows[0].description, 
                id
            ])

        res.json({msg: 'อัปเดตข้อมูลประเภทประกันสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        await connection.query('DELETE FROM insurance_type WHERE id = ?', [id])

        res.json({msg: 'ลบสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}