const db = require('../config/database')

exports.createQuotation = async(req, res) => {
    const { quotation_id, fields } = req.body

    if (!quotation_id || !fields) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบ' })
    }

    try {
        for (const [field_code, field_value] of Object.entries(fields)) {
            if (!field_value) continue

            await db.query(
                `
                INSERT INTO quotation_field (quotation_id, field_code, field_value)
                VALUES ($1, $2, $3)
                `,
                [quotation_id, field_code, field_value]
            )
        }
        
        res.json({ 
            success: true,
            msg: 'บันทึกสำเร็จ'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.removeQuotation = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM quotation WHERE id = $1', [id])

        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}