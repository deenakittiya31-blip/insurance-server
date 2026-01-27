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
        const page = Number(req.query.page);
        const per_page = Number(req.query.per_page);
        const sortKey = req.query.sortKey || 'id';
        const sortDirection = req.query.sortDirection || 'DESC';
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const offset = (page - 1) * per_page;
        
        if(page && per_page) {
            const result = await db.query(`SELECT * FROM member ORDER BY ${sortKey} ${validSortDirection} LIMIT $1 OFFSET $2`, [per_page, offset])

            const countResult = await db.query('SELECT COUNT(*)::int as total FROM member')

            return res.json({data: result.rows, total: countResult.rows[0].total})
        } else {
            const result = await db.query(`SELECT * FROM member ORDER BY ${sortKey} ${validSortDirection}`)

            return res.json({data: result.rows})
        }
    
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error'})
    }
}

exports.readMember = async(req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('select first_name, last_name, phone from member where id = $1', [id])

        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.updateMember = async(req, res) => {
    try {
        const { id } = req.params
        const { first_name, last_name, phone } = req.body

        await db.query(
            `update member set first_name = coalesce ($1, first_name), last_name = coalesce ($2, last_name), phone = coalesce ($3, phone) where id = $4`,
            [
                first_name  ?? null, 
                last_name   ?? null, 
                phone       ?? null, 
                id
            ]
        )

        res.json({msg: 'แก้ไขข้อมูลลูกค้าสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.removeMember = async(req, res) => {
    try {
        const { id } = req.params

        await db.query('delete from member where id = $1', [id])

        res.json({msg: 'ลบข้อมูลลูกค้าสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.sendDocumentToMember = async(req, res) => {
    try {
        const { members, q_id } = req.body;

        if (!Array.isArray(members)) {
            return res.status(400).json({ message: 'member ต้องเป็น array' })
        }

        let imageId
        let imageUrl

        //1. ค้นรูปภาพที่ตารางรูปภาพก่อน
        const imageData = await db.query(`select id, quotation_url from image_quotation where compare_id = $1`, [q_id])

        if(imageData.rowCount > 0) {

            // ใช้รูปภาพที่มีอยู่แล้ว
            imageId = imageData.rows[0].id
            imageUrl = imageData.rows[0].quotation_url
        } else {

            //1. สร้างรูปภาพ
            const buffer = await generateCompareJPG(q_id)

            //2. อัปโหลดรูปลง cloudinary ได้ url
            const cloudinaryResult = await uploadToCloudinary(buffer)

            const insertResult = await db.query(`insert into image_quotation (compare_id, quotaion_url, quotation_public_id) values ($1, $2, $3) returning id`, [q_id, cloudinaryResult.secure_url, cloudinaryResult.public_id])

            imageId = insertResult.rows[0].id
            imageUrl = cloudinaryResult.secure_url
        }

        for(const userId of members) {           
            await sendImage(userId, imageUrl)     

            await db.query(`insert into history_send_quotation (compare_id, member_id, quotation_img_id) values ($1, $2, $3)`, [q_id, userId, imageId])
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
