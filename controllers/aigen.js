const axios = require('axios')

const api = "https://api.aigen.online/aiscript/vehicle-insurance-policy/v1";

exports.aigen = async(req, res) => {
    try {
        const { base64, type } = req.body

        if (!base64 || !type) {
      return res.status(400).json({ msg: 'ข้อมูลไม่ครบ' })
    }

         const payload = {
            language: "th",
            file: {
                type,          // 'pdf' | 'image'
                content: base64
            }
        }

        console.log(JSON.stringify(payload, null, 2))
 
        const response = await axios.post(api, payload, {
                headers: {
                    "x-aigen-key": process.env.AIGEN_KEY,
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