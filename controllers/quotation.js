const db = require('../config/database')

exports.getQuotationDetail = async(req, res) => {
    try {
        const {quotation} = req.params
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}