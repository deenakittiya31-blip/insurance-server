const db = require('../config/database')
const cloudinary = require('../config/cloudinary')

exports.create = async(req, res) => {
    try {
        const { group_name, logo_url, logo_public_id } = req.body

        console.log('CREATE GROUP CALLED')

        await db.query(
            `
            insert into group_member (group_name, logo_url, logo_public_id) values ($1, $2, $3)
            `, [group_name, logo_url, logo_public_id])

        res.json({msg: 'สร้างกลุ่มลูกค้าสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.list = async(req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortKey = 'id',
            sortDirection = 'DESC',
            search
        } = req.query;

        const allowedSortKeys = [
            'id',
            'group_name',
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
            conditions.push(`group_name ILIKE $${paramIndex}`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const countResult = await db.query(
            `
            SELECT COUNT(*)::int as total 
            FROM group_member
            ${whereClause}
            `, values)

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(`select * from group_member ${whereClause} 
            ORDER BY ${finalSortKey} ${validSortDirection} 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...values, limitNum, offset])

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

exports.listSelect = async(req, res) => {
    try {
        //ตั้ง Cache-Control Header
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')

        const result = await db.query('select * from group_member where is_active = true order by id desc')

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params

        const result = await db.query('SELECT id, group_name, logo_url, logo_public_id FROM group_member WHERE id = $1', [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { group_name, logo_url, logo_public_id } = req.body
        const { id } = req.params

        const existing = await db.query('select * from group_member where id = $1', [id])

        const oldGroup = existing.rows[0]

        await db.query('update group_member set group_name = $1, logo_url = $2, logo_public_id = $3 where id = $4'
            , [
                group_name          ?? oldGroup.group_name, 
                logo_url           ?? oldGroup.logo_url, 
                logo_public_id      ?? oldGroup.logo_public_id,
                id
            ])

        res.json({msg: 'แก้ไขชื่อกลุ่มสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.remove = async(req, res) => {
    try {
        const { id } = req.params

        const result = await db.query('SELECT * FROM group_member WHERE id = $1', [id])

        if(result.rows.length === 0){
            return res.status(404).json({msg: 'ไม่เจอกลุ่มนี้'})
        }

        const {logo_public_id} = result.rows[0]

        //2 ถ้ามี logo_public_id ให้ลบรูปก่อน
        if(logo_public_id){
            await cloudinary.uploader.destroy(logo_public_id)
        }

        await db.query('delete from group_member where id = $1', [id])

        res.json({msg: 'ลบกลุ่มลูกค้าสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.is_active = async(req, res) => {
    try {
        const {is_active} = req.body
        const {id} = req.params

        await db.query('UPDATE group_member SET is_active = $1 WHERE id = $2', [is_active, id])

        res.json({msg: 'อัปเดตกลุ่มสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}