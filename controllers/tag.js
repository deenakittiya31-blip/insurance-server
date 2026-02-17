const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { tag_name } = req.body

        const result = await db.query('INSERT INTO tag(tag_name) VALUES($1) RETURNING *', [tag_name])

        res.json({ 
            msg: 'เพิ่มป้ายกำกับสำเร็จ',
            data: result.rows[0] 
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.addMembers = async(req, res) => {
    try {
        const { tag_id, members } = req.body

        for(const userId of members) {
            await db.query('INSERT INTO tag_member(tag_id, member_id) VALUES($1, $2)', [Number(tag_id), userId])
        }
      

        res.json({ msg: 'เพิ่มเพิ่มสมาชิกเข้าป้ายกำกับสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.removeTagFromMember = async(req, res) => {
    try {
        const { id } = req.params

        await db.query('DELETE FROM tag_member WHERE id = $1', [Number(id)])
      
        res.json({ msg: 'ลบป้ายกำกับสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
        
        const {
            page = 1,
            limit = 10,
            sortKey = 'id',
            sortDirection = 'DESC',
            search
        } = req.query;

        const allowedSortKeys = [
            'id',
            'tag_name',
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

        if (search) {
            conditions.push(`tag_name ILIKE $${paramIndex}`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const countResult = await db.query(`SELECT COUNT(*)::int as total FROM tag ${whereClause}`, values)

        const totalItems = countResult.rows[0].total
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(
            `
            SELECT id, tag_name, is_active 
            FROM tag
            ${whereClause} 
            ORDER BY ${finalSortKey} ${validSortDirection} 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `, 
            [...values, limitNum, offset])

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
            })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

        const result = await db.query('SELECT id, tag_name FROM tag WHERE is_active = true ORDER BY id DESC')
         if (result.rows.length === 0) {
            return res.json({ data: [] })
        }

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server errer'})
    }
}

exports.update = async(req, res) => {
    const { tag_name } = req.body;
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM tag WHERE id = $1', [id])

        const old = result.rows[0]

        const resultUpdate = await db.query('UPDATE tag SET tag_name = $1 WHERE id = $2 RETURNING *', 
            [
                tag_name     ?? old.tag_name, 
                id
            ])

        res.json({
            msg: 'แก้ไขป้ายกำกับสำเร็จ',
            data: resultUpdate.rows[0] 
        })  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.is_active = async(req, res) => {
    try {
        const {is_active} = req.body
        const {id} = req.params

        const result = await db.query('UPDATE tag SET is_active = $1 WHERE id = $2 RETURNING *', 
        [is_active, id])

        res.json({
            msg: 'อัปเดตป้ายกำกับสำเร็จ',
            data: result.rows[0] 
        })  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        const result = await db.query('DELETE FROM tag WHERE id = $1 RETURNING *', [id])

        res.json({
            msg: 'ลบป้ายกำกับสำเร็จ',
            data: result.rows[0] 
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listMemberByTag = async(req, res) => {
    try {
        const { search } = req.query
        const { id } = req.params

        let conditions = [];
        let values = [id];
        let paramIndex = 2;

        if (search) {
            conditions.push(`
                (
                    m.display_name ILIKE $${paramIndex}
                    OR m.first_name ILIKE $${paramIndex}
                    OR m.last_name ILIKE $${paramIndex}
                    OR m.phone ILIKE $${paramIndex}
                    OR gm.group_name ILIKE $${paramIndex}
                )
            `);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = `
            WHERE tm.tag_id = $1
            ${conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''}
        `;


        const result = await db.query(
            `
            select
                m.id,
                m.user_id,
                m.display_name,
                m.first_name,
                m.last_name,
                m.phone,
                m.picture_url,
                gm.group_name
            from
                tag_member tm
                join member m on tm.member_id = m.user_id
                left join group_member gm on m.group_id = gm.id
            ${whereClause}
            order by m.id DESC
            `,
            values
        )

        const countResult = await db.query(`SELECT COUNT(*)::int as total FROM tag_member WHERE tag_id = $1`, [id])

        res.json({data: result.rows, total: countResult.rows[0].total})
        
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}