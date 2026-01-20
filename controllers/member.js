const db = require('../config/database');
const { pushWelcomeFlex } = require('../services/lineService');

exports.registerMember = async(req, res) => {
    try {
        const { user_id, first_name, last_name, phone, display_name, picture_url } = req.body;

        if(!user_id || !phone){
            return res.status(400).json({message: 'ข้อมูลไม่ถูกต้อง'})
        }

        await db.query(
            `
            INSERT INTO member 
            (user_id, display_name, first_name, last_name, phone, picture_url)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (user_id)
            DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                phone = EXCLUDED.phone,
                display_name = EXCLUDED.display_name,
                picture_url = EXCLUDED.picture_url
            `,
            [user_id, display_name, first_name, last_name, phone, picture_url]
        )

         // ส่ง Flex Message ต้อนรับ
        await pushWelcomeFlex(user_id, first_name)

        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}