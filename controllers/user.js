const db = require('../config/database')
const cloudinary = require('../config/cloudinary')

exports.list = async(req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortKey = 'user_id',
            sortDirection = 'DESC',
            search
        } = req.query

        const allowedSortKeys = [
            'user_id',
            'name',
            'email',
            'phone',
            'role',
            'first_name',
            'last_name',
            'created_at'
        ]

        const pageNum = parseInt(page, 10)
        const limitNum = parseInt(limit, 10)
        const offset = (pageNum - 1) * limitNum
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const finalSortKey = allowedSortKeys.includes(sortKey)
            ? sortKey
            : 'user_id'

        let conditions = [];
        let values = [];
        let paramIndex = 1;

        if (search) {
            conditions.push(`
                (
                    name ILIKE $${paramIndex}
                    OR email ILIKE $${paramIndex}
                    OR phone ILIKE $${paramIndex}
                    OR role ILIKE $${paramIndex}
                    OR first_name ILIKE $${paramIndex}
                    OR last_name ILIKE $${paramIndex}
                )
            `);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const countResult = await db.query(`SELECT COUNT(*)::int as total FROM users ${whereClause}`, values)

        const totalItems = countResult.rows[0].total
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(
            `
            SELECT * 
            FROM users 
            ${whereClause} 
            ORDER BY ${finalSortKey} ${validSortDirection} 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `, [...values, limitNum, offset])


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

exports.read = async(req, res) => {
    try {
        const {id} = req.params
        
        const query = 'SELECT user_id, name, email, phone, role, logo_url, logo_public_id, first_name, last_name FROM users WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}
exports.update = async(req, res) => {
    try {
        const { name, email, phone, role, logo_url, logo_public_id, first_name, last_name } = req.body
        const { id } = req.params

        const existing = await db.query('SELECT * FROM  users WHERE id = $1',[id])

        const userOld = existing.rows[0]

        await db.query('UPDATE users SET name = $1, email = $2, phone = $3, logo_url = $4, logo_public_id = $5, first_name = $6, last_name = $7  WHERE id = $8', 
          [
            name            ?? userOld.name, 
            email           ?? userOld.email, 
            phone           ?? userOld.phone, 
            role            ?? userOld.role, 
            logo_url        ?? userOld.logo_url, 
            logo_public_id  ?? userOld.logo_public_id, 
            first_name      ?? userOld.first_name, 
            last_name       ?? userOld.last_name,
            id

          ])

        res.json({msg: 'แก้ไขข้อมูลผู้ใช้สำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.is_active = async(req, res) => {
    try {
        const { is_active } = req.body
        const { id } = req.params

        await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id])

        res.json({msg: 'อัปเดตสถานะผู้ใช้สำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.remove = async(req, res) => {
    try {
        const { id } = req.params

        const result = await db.query('select logo_public_id from users where id = $1', [id])

        const { logo_public_id } = result.rows[0]
        
        if(logo_public_id) {
            await cloudinary.uploader.destroy(logo_public_id)
        }

        await db.query('delete from users where id = $1', [id])

        res.json({msg: 'ลบข้อมูลผู้ใช้สำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}