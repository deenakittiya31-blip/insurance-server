const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { type, code, car_usage_id } = req.body

        await db.query('INSERT INTO car_type(type, code, car_usage_id) VALUES($1, $2, $3)', [type, code, car_usage_id])

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
        const result = await db.query(
            'SELECT ct.id, ct.type, ct.code, cu.usage_name FROM car_type as ct JOIN car_usage as cu ON ct.car_usage_id = cu.id ORDER BY id ASC LIMIT $1 OFFSET $2', [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_type')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT ct.id, ct.type, cu.usage_name as usage FROM car_type as ct join car_usage as cu on ct.car_usage_id = cu.id')

        res.json({  data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req,res)=>{
    try {
        const { id } = req.params
        const result = await db.query('SELECT type, code, car_usage_id FROM car_type WHERE id = $1', [id])


        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
    const { type, code, car_usage_id } = req.body;
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM car_type WHERE id = $1', [id])

        const old = result.rows[0]

        await db.query('UPDATE car_type SET type = $1, code = $2, car_usage_id = $3 WHERE id = $4', 
            [
                type                ?? old.type,
                code                ?? old.code, 
                car_usage_id        !== undefined ? Number(car_usage_id) : old.car_usage_id,
                id
            ])

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