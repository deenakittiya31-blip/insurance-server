const axios = require('axios');
const field = require('../config/payloadField');
const db = require('../config/database');

const api = 'https://backend.aksonocr.com/api/v1/key-extract-url'

exports.akson = async(req, res) => {
    try {
        const {image, company_id, compare_id} = req.body;

        if (!image) {
            return res.status(400).json({
            success: false,
            message: 'ไม่ข้อมูล'
            })
        }

        await db.query('INSERT INTO quotation(company_id, compare_id) VALUES ($1, $2)',
            [
                Number(company_id),
                compare_id
            ]
        )

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
            ocrData
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

