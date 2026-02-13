const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { name, logo_url, logo_public_id } = req.body

      await db.query(
      `INSERT INTO car_brand (name, logo_url, logo_public_id, is_active)
       VALUES ($1, $2, $3, true)`,
      [name, logo_url, logo_public_id]
    )

    res.json({ msg: 'เพิ่มยี่ห้อรถสำเร็จ' })
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
            'name',
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
            conditions.push(`name ILIKE $${paramIndex}`);
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
            FROM car_brand
            ${whereClause}
            `, values)

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(`
            SELECT id, name, logo_url, logo_public_id, is_active 
            FROM car_brand 
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
        const result = await db.query('SELECT id, name FROM car_brand WHERE is_active = true ORDER BY id')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, name, logo_url, logo_public_id FROM car_brand WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const { name, logo_url, logo_public_id } = req.body;
    const { id } = req.params;

    try {
        const existing = await db.query('SELECT * FROM  car_brand WHERE id = $1',[id])

        const brand = existing.rows[0]

        await db.query('UPDATE car_brand SET name = $1, logo_url = $2, logo_public_id = $3  WHERE id = $4', 
          [
            name            ?? brand.name,           
            logo_url        ?? brand.logo_url, 
            logo_public_id  ?? brand.logo_public_id, 
            id

          ])

        res.json({msg: 'แก้ไขยี่ห้อรถสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.is_active = async(req, res) => {
    try {
            const {is_active} = req.body
            const {id} = req.params

            await db.query('UPDATE car_brand SET is_active = $1 WHERE id = $2', 
            [is_active, id])

        res.json({msg: 'อัปเดตสถานะสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        console.log(id)
        await db.query('DELETE FROM car_brand WHERE id = $1', [id])

        res.json({msg: 'ลบยี่ห้อรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}