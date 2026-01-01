const axios = require('axios')

const api = "https://api.aigen.online/aiscript/general-invoice/v2";

exports.aigen = async(req, res) => {
    try {
        const { base64, type } = req.body

        if (!base64) {
            return res.status(400).json({ msg: 'ไม่มีไฟล์' })
        }

        const payload =
        type === 'pdf'
        ? { pdf: base64 }
        : { image: base64 }
 
        const response = await axios.post(api, payload, {
                headers: {
                    "x-aigen-key": process.env.AIGEN_KEY,
                    'Content-Type': 'application/json'
                }
            })

        res.status(200).json(response.data)
    } catch (err) {
       console.error('AIGEN ERROR:', err?.response?.data || err.message)
        res.status(500).json({
            message: "AIGEN API error",
            error: err?.response?.data
        })
    }
}