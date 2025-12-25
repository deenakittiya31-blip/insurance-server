const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { usage } = req.body

        await db.query('INSERT INTO car_usage (usage_name) VALUES ($1)', [usage]);

        res.json({ msg: 'เพิ่มประเภทการใช้งานรถสำเร็จ' })
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
        const result = await db.query('SELECT id, usage_name FROM car_usage ORDER BY id ASC LIMIT $1 OFFSET $2', [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_usage')

        res.json({data: result.rows, total: countResult.rows[0].total})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, usage_name FROM car_usage')

        res.json({  data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { usage } = req.body;
        const { id } = req.params;

        await db.query('UPDATE car_usage SET usage_name = $1 WHERE id = $2', [usage, id])

        res.json({msg: 'แก้ไขประเภทการใช้งานรถสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM car_usage WHERE id = $1', [id])

        res.json({msg: 'ลบประเภทการใช้งานรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}