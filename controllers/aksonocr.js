const axios = require('axios');
const field = require('../config/payloadField');
const db = require('../config/database');

const api = 'https://backend.aksonocr.com/api/v1/key-extract-url'

exports.akson = async(req, res) => {
    try {
        const {image, company_id, compare_id, doc_id} = req.body;

        if (!image) {
            return res.status(400).json({
            success: false,
            message: 'ไม่ข้อมูล'
            })
        }

        const document_id = `${company_id}-${doc_id}`

        //สร้าง quotation ว่าเป็นของบริษัทไหนอยู่ในใบเสนอราคาที่เท่าไหร่
        const insertResult = await db.query('INSERT INTO quotation(company_id, q_id, doc_id) VALUES ($1, $2, $3) RETURNING id',
            [
                Number(company_id),
                compare_id,
                document_id
            ]
        )

        const id = insertResult.rows[0].id

        const payload = {
            base64Image: image,
            customFields:  field,
            additionalInstructions: "Extract numbers without commas or currency symbols. Dates in DD/MM/YYYY format."
        }

        const ocrRes = await axios.post(api, payload, {
            headers: {
                "X-API-Key": process.env.AKSON_KEY,
                "Content-Type": "application/json"
            },
            timeout: 60000
        })

        const ocrData = ocrRes.data.data

        return res.json({
            success: true,
            ocrData,
            id: id
        })  

    } catch (err) {
        console.error(err.response?.data || err.message)
        return res.status(500).json({
            success: false,
            message: 'AksonOCR error',
            error: err.response?.data
        })
    }
}

