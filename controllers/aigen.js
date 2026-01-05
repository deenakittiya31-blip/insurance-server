const axios = require('axios')

const api = "https://api.aigen.online/aiscript/vehicle-insurance-policy/v1";

exports.aigen = async(req, res) => {
    try {
        const { image, type } = req.body

        console.log(image, type)

        if (!image || typeof image !== 'string') {
            return res.status(400).json({ msg: 'image ต้องเป็น base64 string' })
        }

        const headers = {
            "x-aigen-key": process.env.AIGEN_KEY,
            "Content-Type": "application/json"
        };

        const payload = {};
        if (type === 'application/pdf') {
            payload.pdf = image;
        } else {
            payload.image = image;
        }
 
        const response = await axios.post(api, payload, { headers: headers })

         console.log('AIGEN Response:', response.data)

        // ส่งข้อมูลที่ได้จาก API กลับไปให้ Frontend
        res.status(200).json({
            message: 'success',
            data: response.data
        })
    } catch (err) {
       console.error('AIGEN ERROR:', err?.response?.data || err.message)
        res.status(500).json({
            message: "AIGEN API error",
            error: err?.response?.data
        })
    }
}