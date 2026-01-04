const axios = require('axios')

const api = "https://api.aigen.online/aiscript/vehicle-insurance-policy/v1";

exports.aigen = async(req, res) => {
    try {
        const { image } = req.body

        if (!image) {
      return res.status(400).json({ msg: 'ไม่มีรูปภาพ' })
    }

         const payload = {
            language: "th",
            image: image           
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