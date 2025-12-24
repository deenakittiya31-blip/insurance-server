const connection = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { type } = req.body

        await connection.query('INSERT INTO car_type(type) VALUES(?)', [type])

        res.json({ msg: 'เพิ่มประเภทรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const [rows] = await connection.query('SELECT id, type FROM car_type')

        res.json({ data: rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { type } = req.body;
        const { id } = req.params;

        await connection.query('UPDATE car_type SET type = ? WHERE id = ?', [type, id])

        res.json({message: 'แก้ไขประเภทรถสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        console.log(id)
        await connection.query('DELETE FROM car_type WHERE id = ?', [id])

        res.json({message: 'ลบประเภทรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}