const db = require('../config/database');
const { pushWelcomeFlex, sendImage } = require('../services/lineService');
const { generateCompareJPG } = require('../utils/generateCompareJPG');
const { uploadToCloudinary } = require('./image');

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
             display_name   = $2, 
             first_name     = $3, 
             last_name      = $4, 
             phone          = $5, 
             picture_url    = $6,
             is_registered = true
            where user_id = $1
            `,
            [ user_id, display_name, first_name, last_name, phone, picture_url ]
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
        const sortKey = req.query.sortKey || 'id';
        const sortDirection = req.query.sortDirection || 'DESC';
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const result = await db.query(`SELECT * FROM member ORDER BY ${sortKey} ${validSortDirection}`)

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error'})
    }
}

exports.sendDocumentToMember = async(req, res) => {
    try {
        const { members, q_id } = req.body;

        if (!Array.isArray(members)) {
            return res.status(400).json({ message: 'member ต้องเป็น array' })
        }

        //1. สร้างรูปภาพ
        const buffer = await generateCompareJPG(q_id)

        //2. อัปโหลดรูปลง cloudinary ได้ url
        const imageUrl = await uploadToCloudinary(buffer)

        //3. ส่ง line
        for(const userId of members) {           
            await sendImage(userId, imageUrl)           
        }

        res.json({msg: 'ส่งใบเสนอราคาเรียบร้อย'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.searchMember = async(req, res) => {
    try {
        const { search } = req.body;

        const result = await db.query(
            `
            SELECT 
              *
            FROM member
            WHERE
                display_name ILIKE $1 OR
                first_name ILIKE $1 OR
                last_name ILIKE $1 OR
                phone ILIKE $1
            ORDER BY created_at DESC
            `,
            [`%${search}%`]
        );

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}
