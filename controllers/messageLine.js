const { sendText, sendImage } = require('../services/lineService');

exports.sendMessageLine = async(req, res) => {
    try {
        const { text, image, members } = req.body

        if (!members || !members.length) {
            return res.status(400).json({ message: 'กรุณาเลือกสมาชิกก่อน' });
        }

        for(const userId of members){
            if(text){
                await sendText(userId, text)
            }

            if(image){
                await sendImage(userId, image)
            }
        }

        res.json({msg: 'ส่งข้อความสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}