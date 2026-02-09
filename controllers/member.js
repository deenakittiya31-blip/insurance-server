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
                is_registered  = true,
                group_id       = 5
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

        const offset = (page - 1) * per_page

        const result = await db.query(
                `
            SELECT 
                m.id, 
                m.user_id, 
                m.display_name, 
                m.first_name, 
                m.last_name, 
                m.phone, 
                m.picture_url, 
                m.created_at, 
                m.note,
                m.group_id,
                gm.group_name  
            FROM member AS m 
            LEFT JOIN group_member AS gm ON m.group_id = gm.id
            ORDER BY ${sortKey} ${validSortDirection}
            LIMIT $1 OFFSET $2
        `
           , [per_page, offset] )
            
            
        const countResult = await db.query('SELECT COUNT(*)::int as total FROM member')

        res.json({
            data: result.rows, 
            total: countResult.rows[0].total
        })
    
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error'})
    }
}

exports.listMemberForMessage = async(req, res) => {
    try {
        const {group_id} = req.query;
        const sortKey = req.query.sortKey || 'id';
        const sortDirection = req.query.sortDirection || 'DESC'
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

        let whereClause = ''
        let queryParams = []

        if (group_id) {
            const groupIds = group_id.split(',')

            const hasNoGroup = groupIds.includes('null') || groupIds.includes('no_group')
            const normalGroupIds = groupIds.filter(
                id => id !== 'null' && id !== 'no_group'
            )

            const conditions = []

            if (normalGroupIds.length > 0) {
                conditions.push(`m.group_id = ANY($1)`)
                queryParams.push(normalGroupIds)
            }

            if (hasNoGroup) {
                conditions.push(`m.group_id IS NULL`)
            }

            if (conditions.length > 0) {
                whereClause = `WHERE ${conditions.join(' OR ')}`
            }
        }


        const result = await db.query(
            `
            SELECT 
                m.id, 
                m.user_id, 
                m.display_name, 
                m.first_name, 
                m.last_name, 
                m.phone, 
                m.picture_url, 
                m.created_at, 
                m.note,
                m.group_id,
                gm.group_name  
            FROM member AS m 
            LEFT JOIN group_member AS gm ON m.group_id = gm.id
            ${whereClause}
            ORDER BY ${sortKey} ${validSortDirection}
        `
           , queryParams)
            

        res.json({ data: result.rows })
    
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error'})
    }
}

exports.readMember = async(req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `
            select first_name, last_name, group_id, gm.group_name,  phone, note
            from member 
            left join group_member as gm on member.group_id = gm.id where member.id = $1
            `
            , [id])

        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.updateMember = async(req, res) => {
    try {
        const { id } = req.params
        const { first_name, last_name, group_id, phone, note } = req.body

        await db.query(
            `update member set first_name = coalesce ($1, first_name), last_name = coalesce ($2, last_name), group_id = coalesce ($3, group_id), phone = coalesce ($4, phone), note = coalesce ($5, note) where id = $6`,
            [
                first_name  ?? null, 
                last_name   ?? null, 
                group_id    ??  null, 
                phone       ?? null, 
                note        ?? null, 
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

        //1. สร้างเลขเอกสรส่งลูกค้า
        const publicCompare = await createPublicCompare(q_id)

        //2. สร้างรูปภาพ
        const buffer = await generateCompareJPG(q_id, publicCompare)

        //2. อัปโหลดรูปลง cloudinary ได้ url
        const imgUrl = await uploadToCloudinary(buffer)

        for(const userId of members) {           
            await sendImage(userId, imgUrl)     

            await db.query(`insert into history_send_quotation (compare_id, member_id, public_compare_no) values ($1, $2, $3)`, [q_id, userId, publicCompare])
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
                m.id,
                m.user_id,
                m.display_name,
                m.first_name,
                m.last_name,
                m.phone,
                m.picture_url,
                m.created_at,
                m.group_id,
                gm.group_name
            FROM member AS m
            LEFT JOIN group_member AS gm ON m.group_id = gm.id
            WHERE
                m.display_name ILIKE $1 OR
                m.first_name ILIKE $1 OR
                m.last_name ILIKE $1 OR
                gm.group_name ILIKE $1 OR
                m.phone ILIKE $1
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

exports.is_active = async(req, res) => {
    try {
        const {is_active} = req.body
        const {id} = req.params

        await db.query('UPDATE member SET is_active = $1 WHERE id = $2', [is_active, id])

        res.json({msg: 'อัปเดตสถานะสมาชิกสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

async function createPublicCompare(quotationId) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

       // lock เฉพาะเดือนนั้น
    const last = await db.query(`
      SELECT version
      FROM quotation_public_compare
      WHERE public_compare_no LIKE $1
      ORDER BY version DESC
      LIMIT 1
      FOR UPDATE
    `, [`QT-${yearMonth}/%`]);

    const nextVersion = last.rows.length
      ? last.rows[0].version + 1
      : 1;

    const publicNo = `QT-${yearMonth}/${String(nextVersion).padStart(3, '0')}`;


    const inserted = await db.query(`
      INSERT INTO quotation_public_compare
        (compare_id, public_compare_no, version)
      VALUES ($1, $2, $3)
      RETURNING public_compare_no
    `, [quotationId, publicNo, nextVersion]);

    return inserted.rows[0].public_compare_no;
  } catch (err) {
    console.log(err)
  }
}
