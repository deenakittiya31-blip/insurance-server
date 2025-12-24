const connection = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { usage } = req.body

        await connection.query('INSERT INTO car_usage (usage_name) VALUES (?)', [usage]);

        res.json({ msg: 'เพิ่มประเภทรถสำเร็จ' })
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

        const [rows] = await connection.query('SELECT id, usage_name FROM car_usage LIMIT ?, ?', [start, per_page])

        const [[{total}]] = await connection.query('SELECT COUNT(*) as total FROM car_usage')
        if(rows.length === 0){
            return res.json({ mdata: [] })
        }

        res.json({ 
            data: rows, 
            total
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const [rows] = await connection.query('SELECT id, usage_name FROM car_usage')

        if(rows.length === 0){
            return res.json({ mdata: [] })
        }

        res.json({  data: rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { usage } = req.body;
        const { id } = req.params;

        await connection.query('UPDATE car_usage SET usage_name = ? WHERE id = ?', [usage, id])

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
        await connection.query('DELETE FROM car_usage WHERE id = ?', [id])

        res.json({message: 'ลบประเภทรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}