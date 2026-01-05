const axios = require('axios');
const field = require('../config/payloadField');

const api = 'https://backend.aksonocr.com/api/v1/key-extract-url'

exports.akson = async(req, res) => {
    try {
        const {base64} = req.body;
        console.log(base64)

        if(!base64){
             return res.status(400).json({ msg: 'image ต้องเป็น base64 string' })
        }

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

        console.log(response.data)

        return res.json({
            success: true,
            data: response.data.data
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

