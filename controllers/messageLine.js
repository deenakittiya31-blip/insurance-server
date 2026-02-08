const db = require('../config/database');
const { sendText, sendImage } = require('../services/lineService');

exports.sendMessageLine = async(req, res) => {
    try {
        const { text, logo_url, members } = req.body

        if (!members || !members.length) {
            return res.status(400).json({ message: 'กรุณาเลือกสมาชิกก่อน' });
        }

        for(const userId of members){
            if(logo_url){
                await sendImage(userId, logo_url)
            }
            if(text){
                await sendText(userId, text)
            }

        }

        res.json({msg: 'ส่งข้อความสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}