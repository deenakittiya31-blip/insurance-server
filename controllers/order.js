const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { promotion_name, logo_public_id, logo_url } = req.body

        await db.query('insert into promotion(promotion_name, logo_public_id, logo_url) values($1, $2, $3)', [promotion_name, logo_public_id, logo_url])

        res.json({ msg: 'เพิ่มข้อมูลโปรโมชั่นสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}