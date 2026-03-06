const db = require('../config/database')
const cloudinary = require('../config/cloudinary')

exports.create = async(req, res) => {
    try {
        const { bank_name, logo_url, logo_public_id } = req.body

      const result = await db.query(
      `INSERT INTO bank (bank_name, logo_url, logo_public_id, is_active)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [bank_name, logo_url, logo_public_id]
    )

       res.json({ 
            msg: 'เพิ่มธนาคารสำเร็จ',
            data: result.rows[0] 
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
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
            'bank_name',
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
            conditions.push(`bank_name ILIKE $${paramIndex}`);
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
            FROM bank
            ${whereClause}
            `, values)

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(`
            SELECT id, bank_name, logo_url, logo_public_id, is_active 
            FROM bank 
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
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, bank_name, logo_url FROM bank WHERE is_active = true ORDER BY id DESC')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, bank_name, logo_url, logo_public_id FROM bank WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const { bank_name, logo_url, logo_public_id } = req.body;
    const { id } = req.params;

    try {
        const existing = await db.query('SELECT * FROM  bank WHERE id = $1',[id])

        const bank = existing.rows[0]

        const resultUpdate = await db.query('UPDATE bank SET bank_name = $1, logo_url = $2, logo_public_id = $3  WHERE id = $4 RETURNING *', 
          [
            bank_name       ?? bank.bank_name,           
            logo_url        ?? bank.logo_url, 
            logo_public_id  ?? bank.logo_public_id, 
            id
          ])
 
         res.json({
            msg: 'แก้ไขธนาคารสำเร็จ',
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

            const result = await db.query('UPDATE bank SET is_active = $1 WHERE id = $2 RETURNING *', 
            [is_active, id])

          res.json({
            msg: 'อัปเดตสถานะสำเร็จ',
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

        const result = await db.query('SELECT * FROM bank WHERE id = $1', [id])

        if(result.rows.length === 0){
            return res.status(404).json({msg: 'ไม่เจอธนาคารยนต์'})
        }

        const {logo_public_id} = result.rows[0]

        if(logo_public_id){
            await cloudinary.uploader.destroy(logo_public_id)
        }
        
        await db.query('DELETE FROM bank WHERE id = $1', [id])

        res.json({msg: 'ลบธนาคารสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}