const db = require('../config/database')

exports.listPayment = async(req, res) => {
    try {
        const result = await db.query('select * from payment_methods')

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}