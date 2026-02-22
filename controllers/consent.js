const db = require('../config/database')
const cloudinary = require('../config/cloudinary')

exports.create = async(req, res) => {
    try {
        const { promotion_name, logo_public_id, logo_url } = req.body

        await db.query('insert into promotion(promotion_name, logo_public_id, logo_url) values($1, $2, $3)', [promotion_name, logo_public_id, logo_url])

        res.json({ msg: 'เพิ่มข้อมูลโปรโมชั่นสำเร็จ' })
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
        } = req.query

        const allowedSortKeys = [
            'id',
            'promotion_name',
            'created_at'
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
            conditions.push(`(promotion_name ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

        const countResult = await db.query(`SELECT COUNT(*)::int as total FROM promotion ${whereClause}`, values)

        const totalItems = countResult.rows[0].total
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(
            `
            SELECT id, promotion_name, logo_url, logo_public_id, is_active 
            FROM promotion 
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

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, promotion_name, logo_url FROM promotion WHERE is_active = true ORDER BY id DESC')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {
        const {id} = req.params
        
        const query = 'SELECT id, promotion_name, logo_url, logo_public_id FROM promotion WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}
exports.update = async(req, res) => {
    try {
        const { promotion_name, logo_url, logo_public_id } = req.body
        const { id } = req.params

        const existing = await db.query('SELECT * FROM  promotion WHERE id = $1',[id])

        const brand = existing.rows[0]

        await db.query('UPDATE promotion SET promotion_name = $1, logo_url = $2, logo_public_id = $3  WHERE id = $4', 
          [
            promotion_name            ?? brand.promotion_name,           
            logo_url        ?? brand.logo_url, 
            logo_public_id  ?? brand.logo_public_id, 
            id

          ])

        res.json({msg: 'แก้ไขโปรโมชั่นสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.is_active = async(req, res) => {
    try {
        const { is_active } = req.body
        const { id } = req.params

        await db.query('UPDATE promotion SET is_active = $1 WHERE id = $2', [is_active, id])

        res.json({msg: 'อัปเดตสถานะโปรโมชั่นสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.remove = async(req, res) => {
    try {
        const { id } = req.params

        const result = await db.query('select logo_public_id from promotion where id = $1', [id])

        const { logo_public_id } = result.rows[0]
        
        if(logo_public_id) {
            await cloudinary.uploader.destroy(logo_public_id)
        }

        await db.query('delete from promotion where id = $1', [id])

        res.json({msg: 'ลบข้อมูลโปรโมชั่นสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}