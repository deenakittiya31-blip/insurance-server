const axios = require('axios');
const field = require('../config/payloadField');

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

        const results = []

        for (let i = 0; i < images.length; i++) {
            const payload = {
                base64Image: base64,
                customFields:  field,
                additionalInstructions: "Extract numbers without commas or currency symbols. Dates in DD/MM/YYYY format."
            }

            const response = await axios.post(api, payload, {
                headers: {
                    "X-API-Key": process.env.AKSON_KEY,
                    "Content-Type": "application/json"
                },
                timeout: 60000
            })

            results.push({
                index: i,
                ocr: response.data.data
            })
        }

           return res.json({data: results})  
            
    } catch (err) {
        console.error(err.response?.data || err.message)
        return res.status(500).json({
            success: false,
            message: 'AksonOCR error',
            error: err.response?.data
        })
    }
}

