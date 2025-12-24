const connection = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { brand_id, name } = req.body

        await connection.query('INSERT INTO car_model(brand_id, name) VALUES(?, ?)', [brand_id, name])

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

        const start = (page - 1) * per_page;

        const [rows] = await connection.query('select cm.id, cb.id as brand_id, cb.name as brand, cm.name from insurance.car_model as cm inner join insurance.car_brand as cb on cm.brand_id = cb.id LIMIT ?, ?', [start, per_page])

        const [[{total}]] = await connection.query('SELECT COUNT(*) as total FROM car_model')
        if(rows.length === 0){
            return res.json({ mdata: [] })
        }

        res.json({ data: rows, total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
   const { id } = req.params
    const fields = []
    const values = []

    if (req.body.brand_id !== undefined) {
        fields.push('brand_id = ?')
        values.push(Number(req.body.brand_id))
    }

    if (req.body.name !== undefined && req.body.name !== '') {
        fields.push('name = ?')
        values.push(req.body.name)
    }

    if (!fields.length) {
        return res.status(400).json({ message: 'ไม่มีข้อมูลให้แก้ไข' })
    }

    values.push(id)

    try {
        await connection.query(
            `UPDATE car_model SET ${fields.join(', ')} WHERE id = ?`,
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
        await connection.query('DELETE FROM car_model WHERE id = ?', [id])

        res.json({message: 'ลบรุ่นรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}