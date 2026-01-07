const db = require('../config/database')

exports.createQuotation = async(req, res) => {
    try {
       // 1. insert และเอา id ออกมา
        const insertResult = await db.query(
            'INSERT INTO quotation_compare DEFAULT VALUES RETURNING id'
        )

        const id = insertResult.rows[0].id

        // 2. สร้าง q_id
        const q_id = `Q${String(id).padStart(3, '0')}`

        // 3. update และ return q_id
        const updateResult = await db.query(
            'UPDATE quotation_compare SET q_id = $1 WHERE id = $2 RETURNING q_id',
            [q_id, id]
        )

       res.json({
            q_id: updateResult.rows[0].q_id
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.getQuotationDetail = async(req, res) => {
    try {
        console.log('hello')
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}