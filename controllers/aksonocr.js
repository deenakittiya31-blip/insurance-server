const axios = require('axios');
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

        const document_id = `${compare_id}-${doc_id}`

        //สร้าง quotation ว่าเป็นของบริษัทไหนอยู่ในใบเสนอราคาที่เท่าไหร่
        const insertResult = await db.query('INSERT INTO quotation(company_id, compare_id, doc_id) VALUES ($1, $2, $3) RETURNING id',
            [
                Number(company_id),
                compare_id,
                document_id
            ]
        )

        const id = insertResult.rows[0].id

        //ดีงข้อมูลฟิลด์ custom และคำแนะนำเพิ่มเติม
        const resultCustom  = await db.query('select key_name, description, example_value from company_theme where company_id = $1',[company_id])
        const resultAddition  = await db.query('select additional from additional_theme where company_id = $1',[company_id])

        //แปลงให้ตรงกับสิ่งที่ akson ต้องการ
        const customFields =  resultCustom.rows.map(item => ({
            key: item.key_name,
            description: item.description,
            example: item.example_value
        }))

        const additionalInstructions = resultAddition.rows[0]?.additional || ''

        console.log(customFields)
        console.log(additionalInstructions)

        //เตรียมข้อมูล
        const payload = {
            model: "AksonOCR-1.0",
            base64Image: image,
            customFields,
            additionalInstructions
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

exports.createQuotation = async(req, res) => {
    try {
        const {company_id, compare_id, doc_id} = req.body;

        const document_id = `${compare_id}-${doc_id}`

        //สร้าง quotation ว่าเป็นของบริษัทไหนอยู่ในใบเสนอราคาที่เท่าไหร่
        const insertResult = await db.query('INSERT INTO quotation(company_id, compare_id, doc_id) VALUES ($1, $2, $3) RETURNING id',
            [
                Number(company_id),
                compare_id,
                document_id
            ]
        )

        const id = insertResult.rows[0].id

        return res.json({
            success: true,
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

exports.testdata = async(req, res) => {
    try {
        const { company_id} = req.body;

        const resultCustom  = await db.query('select key_name, description, example_value from company_theme where company_id = $1',[company_id])
        const resultAddition  = await db.query('select additional from additional_theme where company_id = $1',[company_id])

        //แปลงให้ตรงกับสิ่งที่ akson ต้องการ
        const customFields =  resultCustom.rows.map(item => ({
            key: item.key_name,
            description: item.description,
            example: item.example_value
        }))
        
        const additionalInstructions = resultAddition.rows[0]?.additional || ''

        console.log(additionalInstructions)
        console.log(customFields)
    } catch (error) {
        console.log(error)
    }
}

