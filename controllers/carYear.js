const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { year_be, year_ad } = req.body

        await db.query('INSERT INTO car_year(year_be, year_ad, is_active) VALUES($1, $2, true)', [year_be, year_ad])

        res.json({ msg: 'เพิ่มปีสำเร็จ' })
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
            'year_be',
            'year_ad'
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
                    year_be ILIKE $${paramIndex}
                    OR year_ad ILIKE $${paramIndex}
                )
            `);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';

                       // นับจำนวนทั้งหมด
        const countResult = await db.query(
            `
            SELECT COUNT(*)::int as total 
            FROM car_year
            ${whereClause}
            `, values)

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(
            `
            SELECT id, year_be, year_ad, is_active 
            FROM car_year 
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
        const result = await db.query('SELECT id, year_be, year_ad FROM car_year WHERE is_active = true ORDER BY id DESC')
         if (result.rows.length === 0) {
            return res.json({ data: [] })
        }

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server errer'})
    }
}

exports.read = async(req,res)=>{
    try {
        const { id } = req.params
        const result = await db.query('SELECT id, year_be, year_ad FROM car_year WHERE id = $1', [id])


        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
            const { year_be, year_ad } = req.body;
        const { id } = req.params;
    try {
         const result = await db.query('SELECT * FROM car_year WHERE id = $1', [id])

        const old = result.rows[0]

        await db.query('UPDATE car_year SET year_be = $1, year_ad = $2 WHERE id = $3', 
            [
                year_be     ?? old.year_be, 
                year_ad     ?? old.year_ad, 
                id])

        res.json({msg: 'แก้ไขปีสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}


exports.is_active = async(req, res) => {
    try {
            const {is_active} = req.body
            const {id} = req.params

            await db.query('UPDATE car_year SET is_active = $1 WHERE id = $2', 
            [is_active, id])

        res.json({msg: 'อัปเดตประเภทรถยนต์สำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        console.log(id)
        await db.query('DELETE FROM car_year WHERE id = $1', [id])

        res.json({msg: 'ลบปีสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}