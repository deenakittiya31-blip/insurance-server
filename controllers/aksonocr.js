const axios = require('axios');
const field = require('../config/payloadField');
const db = require('../config/database');
const { mapToMainField } = require('../config/mapService');

const api = 'https://backend.aksonocr.com/api/v1/key-extract-url'

exports.akson = async(req, res) => {
    try {
        const {images} = req.body;
        console.log(images)

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
            success: false,
            message: 'images ต้องเป็น array ของ base64'
            })
        }

        //1. โหลด main_field
        const { rows: mainFields } = await db.query('SELECT * FROM main_fields ORDER BY id asc')

        //2️. สร้าง quotation_compare (1 ชุด)
        const compareRes = await db.query(
            `INSERT INTO quotation_compare (created_at)
             VALUES (now())
             RETURNING id`
            )

        const compareId = compareRes.rows[0].id

        const quotations = []

        //3. ประมวลผลทีละไฟล์
        for (let i = 0; i < images.length; i++) {

            // --- OCR ---
            const payload = {
                base64Image: images[i],
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

            // --- MAP OCR → main_fields ---
            const mappedFields = mapToMainField(ocrData, mainFields)

            // --- หา company_id ---
            let companyId = null
            if (ocrData.insurance_company) {
                const companyRes = await db.query(
                    `SELECT id FROM insurance_company
                     WHERE namecompany ILIKE $1
                     LIMIT 1`,
                     [`%${ocrData.insurance_company}%`]
                )
                companyId = companyRes.rows[0]?.id ?? null
            }

             // --- สร้าง quotation ---
            const quotationRes = await db.query(
                    `INSERT INTO quotation (status, company_id, company_id, )
                     VALUES ('draft', $1, $2 )
                     RETURNING id`,
                    [companyId, compareId]
                )

            const quotationId = quotationRes.rows[0].id

            // --- บันทึก quotation_field ---
            for (const fieldCode in mappedFields) {
                await db.query(
                    `INSERT INTO quotation_field
                     (quotation_id, field_code, field_value)
                     VALUES ($1, $2, $3)`,
                    [
                        quotationId,
                        fieldCode,
                        mappedFields[fieldCode]
                    ]
                )
            }

            quotations.push({
                index: i,
                quotation_id: quotationId,
                company: ocrData.insurance_company,
                fields: mappedFields
            })
        }

        return res.json({
            success: true,
            quotations
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

