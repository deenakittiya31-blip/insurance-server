const axios = require('axios')

const api = "https://api.aigen.online/aiscript/vehicle-insurance-policy/v1";

const headers = {
  "x-aigen-key": process.env.AIGEN_KEY,
  "Content-Type": "application/json"
};

exports.aigen = async(req, res) => {
    try {
        const { image } = req.body

        console.log(typeof image)     // ต้องได้ "string"

        if (!image || typeof image !== 'string') {
      return res.status(400).json({ msg: 'image ต้องเป็น base64 string' })
    }

        const payload = {
      language: "th",
      image: image   // ✅ string เท่านั้น
    }

        console.log(JSON.stringify(image, null, 2))
 
        const response = await axios.post(api, payload, { headers: headers })

        res.status(200).json(response.data)
    } catch (err) {
       console.error('AIGEN ERROR:', err?.response?.data || err.message)
        res.status(500).json({
            message: "AIGEN API error",
            error: err?.response?.data
        })
    }
}