const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { usage } = req.body

        await db.query('INSERT INTO car_usage (usage_name, is_active) VALUES ($1, true)', [usage]);

        res.json({ msg: 'เพิ่มประเภทการใช้งานรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const result = await db.query('SELECT id, usage_name, is_active FROM car_usage ORDER BY id ASC')

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_usage')

        res.json({data: result.rows, total: countResult.rows[0].total})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, usage_name FROM car_usage WHERE is_active = true ORDER BY id ASC')

        res.json({  data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { usage } = req.body;
        const { id } = req.params;

        await db.query('UPDATE car_usage SET usage_name = $1 WHERE id = $2', [usage, id])

        res.json({msg: 'แก้ไขประเภทการใช้งานรถสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.is_active = async(req, res) => {
    try {
            const { is_active } = req.body
            const { id } = req.params

            await db.query('UPDATE car_usage SET is_active = $1 WHERE id = $2', 
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

        await db.query('DELETE FROM car_usage WHERE id = $1', [id])

        res.json({msg: 'ลบประเภทการใช้งานรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

//car usage type
exports.createUsageType = async(req, res) => {
    try {
        const { code, car_type_id, car_usage_id, code_usage, visibility_no } = req.body

        await db.query('INSERT INTO car_usage_type (code, car_type_id, car_usage_id, code_usage, is_active, is_see, visibility_no) VALUES ($1, $2, $3, $4, true, true, $5)'
                        , [
                            code, 
                            Number(car_type_id), 
                            Number(car_usage_id), 
                            code_usage,
                            Number(visibility_no)
                        ]);

        res.json({ msg: 'เพิ่มประเภทการใช้งานรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listUsageType = async(req, res) => {
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
            'code',
            'code_usage',
            'visibility_no',
            'car_type_id',
            'car_usage_id'
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
                    cut.code ILIKE $${paramIndex}
                    OR ct.type ILIKE $${paramIndex}
                    OR cu.usage_name ILIKE $${paramIndex}
                    OR cut.code_usage ILIKE $${paramIndex}
                    OR cut.visibility_no::text ILIKE $${paramIndex}
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
            FROM car_usage_type AS cut
            JOIN car_type AS ct ON cut.car_type_id = ct.id
            JOIN car_usage AS cu ON cut.car_usage_id = cu.id
            ${whereClause}
            `, values)

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limitNum)

        const result = await db.query(
            `
            SELECT
                cut.id,
                cut.code,
                ct.type AS car_type,
                cu.usage_name,
                cut.code_usage,
                cut.is_active,
                cut.is_see,
                cut.visibility_no
            FROM
                car_usage_type AS cut
                join car_type AS ct on cut.car_type_id = ct.id
                join car_usage AS cu on cut.car_usage_id = cu.id
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
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listUsageTypeSelect = async(req, res) => {
    try {
        const result = await db.query(
            `
            select
                cut.id,
                ct.type as car_type,
                cu.usage_name as usage,
                cut.code_usage
            from
                car_usage_type as cut
                join car_type as ct on cut.car_type_id = ct.id
                join car_usage as cu on cut.car_usage_id = cu.id
            where
                cut.is_active = true
            order by
                cut.id asc
            `)

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listUsageTypeSelectMember = async(req, res) => {
    try {
        const result = await db.query(
            `
            select
                cut.id,
                ct.type as car_type,
                cu.usage_name as usage,
                cut.code_usage
            from
                car_usage_type as cut
                join car_type as ct on cut.car_type_id = ct.id
                join car_usage as cu on cut.car_usage_id = cu.id
            where
                cut.is_active = true 
                and cut.is_see = true
            order by
                cut.visibility_no asc
            `)

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.readUsageType = async(req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('select * from car_usage_type where id = $1', [id])

        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.updateUsageType = async(req, res) => {
    try {
        const { id } = req.params;
         const { code, car_type_id, car_usage_id, code_usage, visibility_no } = req.body;

        await db.query(
                `
                UPDATE car_usage_type 
                SET 
                    code = coalesce ($1, code),
                    car_type_id = coalesce ($2, car_type_id),
                    car_usage_id = coalesce ($3, car_usage_id),
                    code_usage = coalesce ($4, code_usage),
                    visibility_no = coalesce ($5, visibility_no)
                WHERE id = $6`
                , [
                    code, 
                    Number(car_type_id), 
                    Number(car_usage_id), 
                    code_usage,
                    Number(visibility_no),
                    id
                  ])

        res.json({msg: 'แก้ไขประเภทการใช้งานรถสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.statusUsageType = async(req, res) => {
    try {
            const { is_active } = req.body
            const { id } = req.params

            await db.query('UPDATE car_usage_type SET is_active = $1 WHERE id = $2', 
            [is_active, id])

        res.json({msg: 'อัปเดตสถานะสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.statusUsageTypeIsSee = async(req, res) => {
    try {
            const { is_see } = req.body
            const { id } = req.params

            await db.query('UPDATE car_usage_type SET is_see = $1 WHERE id = $2', 
            [is_see, id])

        res.json({msg: 'อัปเดตสถานะสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.removeUsageType = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM car_usage_type WHERE id = $1', [id])

        res.json({msg: 'ลบประเภทการใช้งานรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}
