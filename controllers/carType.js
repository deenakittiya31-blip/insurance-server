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
      const page = Number(req.query.page) || 1;
        const per_page = Number(req.query.per_page) || 5;

        const offset = (page - 1) * per_page

    try {
        const result = await db.query('SELECT id, type FROM car_type ORDER BY id ASC LIMIT $1 OFFSET $2', [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_type')

        res.json({ data: result.rows, total: countResult.rows[0].total })
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

        res.json({msg: 'แก้ไขประเภทรถสำเร็จ'}) 
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM car_type WHERE id = $1', [id])

        res.json({msg: 'ลบประเภทรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}