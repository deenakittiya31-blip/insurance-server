const db = require('../config/database')

//สร้างข้อมูลในตาราง quotation_fields
exports.createQuotationFields = async(req, res) => {
    const { quotation_id, fields } = req.body
    try {
        if (!quotation_id || !fields) {
            return res.status(400).json({ message: 'ข้อมูลไม่ครบ' })
        }

        //เช็คว่ามี quotation_id นี้มีอยู่ในฐานข้อมูลไหม ถ้ามีให้ลบแล้วเพิ่มใหม่
        const check = await db.query('select id from quotation_field where quotation_id = $1', [quotation_id])

        if(check.rowCount > 0) {
            await db.query('delete from quotation_field where quotation_id = $1', quotation_id)
        }

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

//สร้างข้อมูลที่ตาราง quotation พร้อมกับบันทึกข้อมูลที่ได้จากการ key-in
exports.createFields = async(req, res) => {
    const { compare_id, company_id, fields, doc_id } = req.body

    try {
         const document_id = `${compare_id}-${doc_id}`

        //สร้าง quotation ว่าเป็นของบริษัทไหนอยู่ในใบเสนอราคาที่เท่าไหร่
        const insertResult = await db.query('INSERT INTO quotation(company_id, compare_id, doc_id) VALUES ($1, $2, $3) RETURNING id',
            [
                Number(company_id),
                compare_id,
                document_id
            ]
        )

        const quotation_id = insertResult.rows[0].id

        for (const [field_code, field_value] of Object.entries(fields)) {
            if (
                field_value === null ||
                field_value === undefined ||
                field_value === ''
            ) continue

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
            quotationId: quotation_id,
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

        const check = await db.query('select id from quotation_field where quotation_id = $1', [id])

        if(check.rowCount > 0) {
            await db.query('delete from quotation_field where quotation_id = $1', [id])
        }

        await db.query('delete from quotation where id = $1', [id])

        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}
