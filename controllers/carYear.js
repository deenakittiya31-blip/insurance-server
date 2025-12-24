const connection = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { year } = req.body

        await connection.query('INSERT INTO car_year(year) VALUES(?)', [year])

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

        const start = (page - 1) * per_page;

        const company = await connection.query('SELECT id, year FROM car_year LIMIT ?, ?', [start, per_page])

        res.json({ data: company[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { year } = req.body;
        const { id } = req.params;

        await connection.query('UPDATE car_year SET year = ? WHERE id = ?', [year, id])

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
        await connection.query('DELETE FROM car_year WHERE id = ?', [id])

        res.json({message: 'ลบปีสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}