const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { type } = req.body

        await db.query('INSERT INTO car_type(type) VALUES($1)', [type])

        res.json({ msg: 'เพิ่มประเภทรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const result = await db.query('SELECT id, type FROM car_type')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { type } = req.body;
        const { id } = req.params;

        await db.query('UPDATE car_type SET type = $1 WHERE id = $2', [type, id])

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
        await db.query('DELETE FROM car_type WHERE id = $1', [id])

        res.json({message: 'ลบประเภทรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}