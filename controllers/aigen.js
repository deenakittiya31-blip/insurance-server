require('dotenv').config
const db = require('../config/database')
const axios = require('axios')

const api = "https://api.aigen.online/aiscript/general-invoice/v2";
const headers = {
  "x-aigen-key": process.env.AIGEN_KEY,
};

exports.aigen = async(req, res) => {
    console.log('AIGEN HIT')
    console.log('body keys:', Object.keys(req.body))

    try {
        const { image } = req.body

        console.log('image length:', image?.length)

        if(!image){
            return res.status(400).json({msg: 'ไม่มีรูปภาพ'})
        }
 
        const response = await axios.post(
            api, 
            {
                image : image

            }, 
            {
                headers: headers
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