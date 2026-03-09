const db = require('../config/database');
const { pushWelcomeFlex, sendImage, switchRishMenu, getFriendshipStatus, getProfile } = require('../services/lineService');
const { generateCompareJPG } = require('../utils/generateCompareJPG');
const { uploadToCloudinary } = require('./image');

exports.registerMember = async(req, res) => {
    try {
        const { user_id, first_name, last_name, phone, display_name, picture_url, consent_accepted, accessToken  } = req.body;

        if(!user_id || !phone){
            return res.status(400).json({message: 'ข้อมูลไม่ครบ'})
        }

        // ถ้าไม่ยินยอม ไม่ให้ลงทะเบียน
        if (!consent_accepted) {
            return res.status(400).json({ message: 'กรุณายินยอมนโยบายความเป็นส่วนตัว' })
        }

        //เช็คสถานะความเป็นเพื่อน
        const isFriend = await getFriendshipStatus(accessToken)
        if(!isFriend){
              return res.status(404).json({ message: 'กรุณาเพิ่มเพื่อนก่อนลงทะเบียน' })
        }

        const result = await db.query(`select is_friend, is_registered from member where user_id = $1`, [user_id])

        //ถ้าไม่มีข้อมูลให้เพิ่มข้อมูล
        if(result.rowCount === 0) {
            const profile = await getProfile(user_id)

            await db.query(`INSERT INTO member (user_id, display_name,  picture_url, is_friend, is_registered, group_id) VALUES ($1, $2, $3, true, false, 'M001')`
            , [user_id, profile.displayName, profile.pictureUrl])
        } else {
            //ถ้ามีข้อมูลก็ให้เช็คก่อน

            if(result.rows[0].is_registered) {
                return res.status(400).json({ message: 'คุณลงทะเบียนแล้ว กรุณาล็อกอินเพื่อเข้าใช้งาน' })
            }

            //ลูกค้าเก่าที่ is_friend ยังเป็น false แต่ผ่าน isFriend มาให้อัปเดต is_friend
            if(!result.rows[0].is_friend){
                await db.query(`update member set is_friend = true where user_id = $1`, [user_id])
            }
        }

        //เช็คเบอร์ซ้ำ
        const phoneCheck = await db.query(`select user_id from member where phone = $1 and user_id != $2`, [phone, user_id])
        
        if (phoneCheck.rowCount > 0) {
            return res.status(400).json({ message: 'เบอร์โทรนี้ถูกใช้งานแล้ว' })
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
                group_id       = 'M002',
                consent_accepted    = true,
                consent_accepted_at = NOW()
            where user_id = $1
            `,
            [ user_id, display_name, first_name, last_name, phone, picture_url ]
        )
        
        //เปลี่ยน rish menu
        await switchRishMenu(user_id)

        //ส่ง Flex Message ต้อนรับ
        await pushWelcomeFlex(user_id, display_name, picture_url)

        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.listMember = async(req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortKey = 'id',
            sortDirection = 'DESC',
            search,
            group_id
        } = req.query;

        const allowedSortKeys = [
            'id',
            'display_name',
            'member_code',
            'first_name',
            'last_name',
            'phone',
            'created_at',
            'group_name'
        ]

        const pageNum = parseInt(page, 10)
        const limitNum = parseInt(limit, 10)
        const offset = (pageNum - 1) * limitNum
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const finalSortKey = allowedSortKeys.includes(sortKey)
    ? sortKey
    : 'id'

        let conditions = [];
        let values = [];
        let paramIndex = 1;

        //Search
        if (search) {
            conditions.push(`
                (
                    m.display_name ILIKE $${paramIndex}
                    m.member_code ILIKE $${paramIndex}
                    OR m.first_name ILIKE $${paramIndex}
                    OR m.last_name ILIKE $${paramIndex}
                    OR m.phone ILIKE $${paramIndex}
                    OR gm.group_name ILIKE $${paramIndex}
                    OR t.tag_name ILIKE $${paramIndex}
                )
            `);
            values.push(`%${search}%`);
            paramIndex++;
        }

        console.log(group_id)
        //Group filter
        if (group_id) {
            conditions.push(`m.group_id = ANY($${paramIndex})`);
            values.push(group_id.split(',').map(Number));
            paramIndex++;
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        // นับจำนวนทั้งหมด
        const countResult = await db.query(
            `
            SELECT COUNT(DISTINCT m.id) as total
            FROM member m
            LEFT join group_member gm on m.group_id = gm.group_code
            LEFT JOIN tag_member tm ON tm.member_id = m.user_id
            LEFT JOIN tag t ON t.id = tm.tag_id
            ${whereClause}
            `,
            values
        )

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limitNum)
        
        const result = await db.query(
            `
            select
                m.id,
                m.user_id,
                m.member_code,
                m.display_name,
                m.first_name,
                m.last_name,
                m.phone,
                m.picture_url,
                m.created_at,
                m.note,
                m.group_id,
                gm.group_name,
                COALESCE(
                    JSONB_AGG(
                        distinct JSONB_BUILD_OBJECT('tag_member_id', tm.id, 'tag_name', t.tag_name)
                    ) FILTER (WHERE tm.tag_id IS NOT NULL),
                    '[]'::jsonb
                ) as tags,
                m.is_active
            from
                member m
            left join group_member gm on m.group_id = gm.group_code
            left join tag_member tm on tm.member_id = m.user_id
            left join tag t on t.id = tm.tag_id
            ${whereClause}
            GROUP BY m.id, gm.group_name
            ORDER BY ${finalSortKey} ${validSortDirection}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `,
            [...values, limitNum, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.readMember = async(req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `
            select
                m.first_name,
                m.last_name,
                m.group_id,
                gm.group_name,
                m.phone,
                m.note,
                m.member_code,
                m.picture_url,
                COALESCE(
                    JSONB_AGG(
                    distinct JSONB_BUILD_OBJECT('tag_member_id', tm.id, 'tag_name', tag.tag_name)
                    ) filter (
                    where
                        tm.id is not null
                    ),
                    '[]'::jsonb
                ) as tags
            from
                member as m
            left join group_member as gm on m.group_id = gm.group_code
            left join tag_member as tm on m.user_id = tm.member_id
            left join tag on tm.tag_id = tag.id
            where
                m.id = $1
            group by
                m.first_name,
                m.last_name,
                m.group_id,
                gm.group_name,
                m.phone,
                m.note,
                m.member_code,
                m.picture_url
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
        const { first_name, last_name, group_id, phone, note, member_code } = req.body

        const result = await db.query(
            'SELECT member_code FROM member WHERE member_code = $1 AND id != $2',
            [member_code, id]
        )

        if (result.rows.length > 0) {
            return res.status(400).json({ message: 'รหัสผู้ใช้ซ้ำ กรุณากรอกรหัสใหม่' })
        }

        await db.query(
            `update member set first_name = coalesce ($1, first_name), last_name = coalesce ($2, last_name), group_id = coalesce ($3, group_id), phone = coalesce ($4, phone), note = coalesce ($5, note), member_code = coalesce ($6, member_code) where id = $7`,
            [
                first_name   ?? null, 
                last_name    ?? null, 
                group_id     ?? null, 
                phone        ?? null, 
                note         ?? null, 
                member_code  ?? null, 
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
        const { members, q_id, mode } = req.body;
        const sender_id = req.user.id

        if (!Array.isArray(members)) {
            return res.status(400).json({ message: 'member ต้องเป็น array' })
        }

        let publicCompare
        let imgUrl

        if (mode) {
            const buffer = await generateCompareJPG(q_id, publicCompare, true)
            imgUrl = await uploadToCloudinary(buffer)

            for (const userId of members) {
                await sendImage(userId, imgUrl)
            }
           
        } else {
            publicCompare = await createPublicCompare(q_id)
            const buffer = await generateCompareJPG(q_id, publicCompare)
            imgUrl = await uploadToCloudinary(buffer)

            for (const userId of members) {
                await sendImage(userId, imgUrl)

                await db.query(
                    `INSERT INTO quotation_send_history 
                     (compare_id, member_id, public_compare_no, sender_id, image_url) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [q_id, userId, publicCompare, sender_id, imgUrl]
                )
            }

        }

        res.json({msg: 'ส่งใบเสนอราคาเรียบร้อย'})
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
