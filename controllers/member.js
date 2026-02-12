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
            'first_name',
            'last_name',
            'phone',
            'created_at',
            'group_name',
            'is_active'
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
            conditions.push(`m.group_id = ANY($${paramIndex}::int[])`);
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
            LEFT JOIN group_member gm ON m.group_id = gm.id
            LEFT JOIN tag_member tm ON tm.member_id = m.id
            LEFT JOIN tag t ON t.id = tm.tag_id
            ${whereClause}
            `,
            values
        )

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limit)
        
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
                gm.group_name,
                COALESCE(ARRAY_AGG(DISTINCT t.tag_name) FILTER (WHERE tm.tag_id IS NOT NULL), '{}') AS tags,
                m.is_active
            FROM member m
            LEFT JOIN group_member gm ON m.group_id = gm.id
            LEFT JOIN tag_member tm ON tm.member_id = m.id
            LEFT JOIN tag t ON t.id = tm.tag_id
            ${whereClause}
            GROUP BY m.id, gm.group_name
            ORDER BY ${finalSortKey} ${validSortDirection}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `,
            [...values, limit, offset]
        );

        res.json({
            data: result.rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.listMemberForMessage = async(req, res) => {
    try {
        const {group_id} = req.query;
        const sortKey = req.query.sortKey || 'id';
        const sortDirection = req.query.sortDirection || 'DESC'
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

           // Pagination parameters
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const offset = (page - 1) * limit

        let whereClause = ''
        let queryParams = []
        let paramIndex = 1

        if (group_id) {
            const groupIds = group_id.split(',')

            const hasNoGroup = groupIds.includes('null') || groupIds.includes('no_group')
            const normalGroupIds = groupIds.filter(
                id => id !== 'null' && id !== 'no_group'
            )

            const conditions = []

            if (normalGroupIds.length > 0) {
                conditions.push(`m.group_id = ANY($${paramIndex})`)
                queryParams.push(normalGroupIds)
                paramIndex++
            }

            if (hasNoGroup) {
                conditions.push(`m.group_id IS NULL`)
            }

            if (conditions.length > 0) {
                whereClause = `WHERE ${conditions.join(' OR ')}`
            }
        }

        // นับจำนวนทั้งหมด
        const countResult = await db.query(
            `
            SELECT COUNT(*) as total
            FROM member AS m 
            ${whereClause}
            `,
            queryParams
        )

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limit)

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
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `
           , [...queryParams, limit, offset])
            

       res.json({ 
            data: result.rows,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        })
    
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
            select 
                m.first_name, 
                m.last_name, 
                m.group_id, 
                gm.group_name,  
                m.phone, 
                m.note,
                COALESCE(
                    JSONB_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'tag_member_id', tm.id,
                            'tag_name', tag.tag_name
                        )
                    ) FILTER (WHERE tm.id IS NOT NULL),
                    '[]'::jsonb
                ) AS tags
            from member as m
            left join group_member as gm on m.group_id = gm.id 
            left join tag_member as tm on m.user_id = tm.member_id
            left join tag on tm.tag_id = tag.id
            where m.id = $1
            group by m.first_name, m.last_name, m.group_id, gm.group_name,  m.phone, m.note
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
        const sender_id = req.user.id

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

            await db.query(`insert into quotation_send_history (compare_id, member_id, public_compare_no, sender_id, image_url) values ($1, $2, $3, $4, $5)`, [q_id, userId, publicCompare, sender_id, imgUrl])
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
