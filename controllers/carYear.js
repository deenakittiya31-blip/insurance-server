const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { year_be, year_ad } = req.body

        await db.query('INSERT INTO car_year(year_be, year_ad) VALUES($1, $2)', [year_be, year_ad])

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

        const result = await db.query('SELECT id, year_be, year_ad FROM car_year order by id desc LIMIT $1 OFFSET $2', [per_page, offset])

         const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_year')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, year_be, year_ad FROM car_year order by id desc')
         if (result.rows.length === 0) {
            return res.json({ data: [] })
        }

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server errer'})
    }
}

exports.read = async(req,res)=>{
    try {
        const { id } = req.params
        const result = await db.query('SELECT id, year_be, year_ad FROM car_year WHERE id = $1', [id])


        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
            const { year_be, year_ad } = req.body;
        const { id } = req.params;
    try {
         const result = await db.query('SELECT * FROM car_year WHERE id = $1', [id])

        const old = result.rows[0]

        await db.query('UPDATE car_year SET year_be = $1, year_ad = $2 WHERE id = $3', 
            [
                year_be     ?? old.year_be, 
                year_ad     ?? old.year_ad, 
                id])

        res.json({msg: 'แก้ไขปีสำเร็จ'})  
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

        res.json({msg: 'ลบปีสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}