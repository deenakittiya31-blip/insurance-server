const { sendText, sendImage } = require('../services/lineService');
const db = require('../config/database');

exports.sendMessageLine = async(req, res) => {
    try {
        const { text, image, members, tags } = req.body

        if (members.length === 0 && tags.length === 0) {
            return res.status(400).json({ message: 'กรุณาเลือกสมาชิกหรือแท็กอย่างน้อย 1 รายการ' });
        }

        let query = `
            SELECT DISTINCT m.user_id
            FROM member m
            LEFT JOIN tag_member tm ON m.id = tm.member_id
            WHERE m.is_active = true
        `

        const conditions = []
        const values = []

        // ส่งตาม member ที่เลือก
        if (members.length > 0) {
            values.push(members)
            conditions.push(`m.user_id = ANY($${values.length})`)
        }

        // ส่งตาม tag
        if (tags.length > 0) {
            values.push(tags)
            conditions.push(`tm.tag_id = ANY($${values.length})`)
        }

        query += ` AND (${conditions.join(' OR ')})`

        console.log(query)

        const result = await db.query(query, values)

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