const { sendText, sendImage } = require('../services/lineService');
const db = require('../config/database');

exports.sendMessageLine = async(req, res) => {
    try {
        const { text, image, members } = req.body

        if (!members || !members.length) {
            return res.status(400).json({ message: 'กรุณาเลือกสมาชิกก่อน' });
        }

        const result = await db.query(
            `SELECT user_id FROM member 
             WHERE is_active = true AND user_id = ANY($1)`,
            [members]
        )

        for(const { user_id } of result.rows){
            if (text) await sendText(user_id, text)
            if (image) await sendImage(user_id, image)           
        }

        res.json({msg: 'ส่งข้อความสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}