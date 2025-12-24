const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { year } = req.body

        await db.query('INSERT INTO car_year(year) VALUES($1)', [year])

        res.json({ msg: 'เพิ่มปีสำเร็จ' })
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

        const result = await db.query('SELECT id, year FROM car_year LIMIT $1 OFFSET $2', [per_page, offset])

         const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_year')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { year } = req.body;
        const { id } = req.params;

        await db.query('UPDATE car_year SET year = $1 WHERE id = $2', [year, id])

        res.json({message: 'แก้ไขปีสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        console.log(id)
        await db.query('DELETE FROM car_year WHERE id = $1', [id])

        res.json({message: 'ลบปีสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}