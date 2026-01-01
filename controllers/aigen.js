require('dotenv').config();
const axios = require('axios')

const api = "https://api.aigen.online/aiscript/general-invoice/v2";

exports.aigen = async(req, res) => {
    try {
        const { image } = req.body

        if(!image){
            return res.status(400).json({msg: 'ไม่มีรูปภาพ'})
        }

        console.log('AIGEN KEY:', process.env.AIGEN_KEY)
 
        const response = await axios.post(
            api, 
            {
                image : image

            }, 
            {
                headers: {
                    "x-aigen-key": process.env.AIGEN_KEY,
                    'Content-Type': 'application/json'
                }
            }
        )

        console.log(response.data)
    } catch (err) {
       console.error('AIGEN ERROR:', err?.response?.data || err.message)
        res.status(500).json({
      message: "AIGEN API error",
      error: err?.response?.data
    })
    }
}