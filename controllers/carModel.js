const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { brand_id, name } = req.body

        await db.query('INSERT INTO car_model(brand_id, name) VALUES($1, $2)', [brand_id, name])

        res.json({ msg: 'เพิ่มรุ่นรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const per_page = Number(req.query.per_page) || 5;

        const offset = (page - 1) * per_page

        const result  = await db.query('select cm.id, cb.id as brand_id, cb.name as brand, cm.name from car_model as cm inner join car_brand as cb on cm.brand_id = cb.id ORDER BY cm.id ASC LIMIT $1 OFFSET $2', [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_model')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req,res)=>{
    try {
        const { id } = req.params
        const result = await db.query('SELECT brand_id, name FROM car_model WHERE id = $1', [id])


        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
   const { id } = req.params
    const fields = []
    const values = []
    let idx = 1

    if (req.body.brand_id !== undefined) {
        fields.push(`brand_id = $${idx}`)
        values.push(Number(req.body.brand_id))
        idx++
    }

    if (req.body.name !== undefined && req.body.name !== '') {
        fields.push(`name = $${idx}`)
        values.push(req.body.name)
        idx++
    }

    if (!fields.length) {
        return res.status(400).json({ message: 'ไม่มีข้อมูลให้แก้ไข' })
    }

    values.push(id)

    try {
        await db.query(
            `UPDATE car_model SET ${fields.join(', ')} WHERE id = $${idx}`,
            values
        )

        res.json({ msg: 'แก้ไขโมเดลรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'server error' })
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        console.log(id)
        await db.query('DELETE FROM car_model WHERE id = $1', [id])

        res.json({msg: 'ลบรุ่นรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}