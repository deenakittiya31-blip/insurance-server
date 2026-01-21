const db = require('../config/database');
const { pushWelcomeFlex, sendImage } = require('../services/lineService');

exports.registerMember = async(req, res) => {
    try {
        const { user_id, first_name, last_name, phone, display_name, picture_url } = req.body;

        if(!user_id || !phone){
            return res.status(400).json({message: 'ข้อมูลไม่ถูกต้อง'})
        }

        await db.query(
            `
            update member 
            set 
             display_name $2, 
             first_name $3, 
             last_name $4, 
             phone $5, 
             picture_url $6,
             is_registered = true
            where user_id = $1
            `,
            [ display_name, first_name, last_name, phone, picture_url ]
        )

         // ส่ง Flex Message ต้อนรับ
        await pushWelcomeFlex(user_id, display_name, picture_url)

        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.listMember = async(req, res) => {
    try {
        const result = await db.query('select * from member order by id asc')

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error'})
    }
}

exports.sendImageToMember = async(req, res) => {
    try {
        const { members, imageUrl  } = req.body;

        if (!Array.isArray(members)) {
            return res.status(400).json({ message: 'member ต้องเป็น array' })
        }

        for(const userId of members) {
            await sendImage(userId, imageUrl )
        }

        res.json({msg: 'ส่งแล้ว'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}