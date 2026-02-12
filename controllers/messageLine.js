const { sendText, sendImage } = require('../services/lineService');
const db = require('../config/database');

exports.sendMessageLine = async(req, res) => {
    try {
        const { text, image, members, tags } = req.body
        const sent_by = req.user.id

        if (members.length === 0 && tags.length === 0) {
            return res.status(400).json({ message: 'กรุณาเลือกสมาชิกหรือแท็กอย่างน้อย 1 รายการ' });
        }

        console.log(tags)

        let query = `
            SELECT 
                m.user_id,
                m.group_id,
                COALESCE(
                    ARRAY_AGG(DISTINCT tm.tag_id) FILTER (WHERE tm.tag_id = ANY($1::int[])),
                    ARRAY[]::integer[]
                ) as matched_tags
            FROM member m
            LEFT JOIN tag_member tm ON m.user_id = tm.member_id
            WHERE m.is_active = true
        `

        console.log('ตอนเข้ามา',query)

        const conditions = []
        const values = []

        values.push(tags.length > 0 ? tags : [])

        // ส่งตาม member ที่เลือก
        if (members.length > 0) {
            values.push(members)
            conditions.push(`m.user_id = ANY($${values.length}::text[])`)
        }

        // ส่งตาม tag
        if (tags.length > 0) {
             conditions.push(`tm.tag_id = ANY($1::int[])`)
        }

        if (conditions.length > 0) {
            query += ` AND (${conditions.join(' OR ')})`
        }

         query += ` GROUP BY m.user_id, m.group_id`

        console.log('ตอนส่ง', query)

        const result = await db.query(query, values)

        const historyQuery = `
            INSERT INTO history_send_quotation 
            (sent_by, sent_to, message, image_url, group_id, tag_id) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `

        for(const row of result.rows){
            const { user_id, group_id, matched_tags } = row

            // ส่งข้อความ
            if (text) await sendText(user_id, text)
            if (image) await sendImage(user_id, image)   
                
            // บันทึกประวัติ - บันทึกแยกตามแต่ละแท็กที่สมาชิกมี
            if (matched_tags && matched_tags.length > 0) {
                // ถ้ามีแท็ก - บันทึกแยกแต่ละแท็ก
                for (const tag_id of matched_tags) {
                    await db.query(historyQuery, [
                        sent_by, 
                        user_id, 
                        text || null, 
                        image || null, 
                        group_id, 
                        tag_id
                    ])
                }
            } else {
                // ถ้าไม่มีแท็ก (ส่งตาม member โดยตรง) - tag_id = null
                await db.query(historyQuery, [
                    sent_by, 
                    user_id, 
                    text || null, 
                    image || null, 
                    group_id, 
                    null  // ไม่มีแท็ก
                ])
            }
        }

        res.json({msg: 'ส่งข้อความสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}