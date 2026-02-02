const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { type, code } = req.body

        await db.query('INSERT INTO car_type(type, code) VALUES($1, $2)', [type, code])

        res.json({ msg: 'เพิ่มประเภทรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.is_active = async(req, res) => {
    try {
            const {is_active} = req.body
            const {id} = req.params

            await db.query('UPDATE car_type SET is_active = $1 WHERE id = $2', 
            [is_active, id])

        res.json({msg: 'อัปเดตประเภทรถยนต์สำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.list = async(req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM car_type ORDER BY id ASC')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT * FROM car_type')

        res.json({  data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req,res)=>{
    try {
        const { id } = req.params
        const result = await db.query('SELECT type, code FROM car_type WHERE id = $1', [id])


        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
    const { type, code } = req.body;
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM car_type WHERE id = $1', [id])

        const old = result.rows[0]

        await db.query('UPDATE car_type SET type = $1, code = $2 WHERE id = $3', 
            [
                type                ?? old.type,
                code                ?? old.code, 
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