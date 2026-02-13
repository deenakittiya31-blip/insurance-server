const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { car_type, car_usage_type_id, code_sub, detail, net_price, vat, stamp, total } = req.body

        await db.query('INSERT INTO compulsory_insurance (car_type, car_usage_type_id, code_sub, detail, net_price, vat, stamp, total, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)', 
                            [
                                car_type, 
                                Number(car_usage_type_id), 
                                code_sub,
                                detail,
                                Number(net_price), 
                                Number(vat), 
                                Number(stamp), 
                                Number(total), 
                            ]
                       );

        res.json({ msg: 'เพิ่ม พ.ร.บ. รถสำเร็จ' })
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
            'car_type',
            'car_usage_type_id',
            'code_sub',
            'detail',
            'net_price',
            'vat',
            'stamp',
            'total'
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
                    ci.car_type ILIKE $${paramIndex}
                    OR ci.code_sub ILIKE $${paramIndex}
                    OR ci.detail ILIKE $${paramIndex}
                    OR ci.net_price ILIKE $${paramIndex}
                    OR ci.vat ILIKE $${paramIndex}
                    OR ci.stamp ILIKE $${paramIndex}
                    OR ci.total ILIKE $${paramIndex}
                    OR cut.code_usage ILIKE $${paramIndex}
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
            SELECT COUNT(*) as total
            FROM compulsory_insurance as ci
            LEFT JOIN car_usage_type AS cut ON ci.car_usage_type_id = cut.id 
            ${whereClause}
            `,
            values
        )

        const totalItems = parseInt(countResult.rows[0].total)
        const totalPages = Math.ceil(totalItems / limitNum)
        const result = await db.query(
            `
            SELECT 
              ci.id, 
              ci.car_type, 
              cut.code_usage,
              ci.code_sub,
              ci.detail,  
              ci.net_price,
              ci.vat, 
              ci.stamp, 
              ci.total,
              ci.is_active 
            FROM compulsory_insurance AS ci 
            LEFT JOIN car_usage_type AS cut ON ci.car_usage_type_id = cut.id 
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

exports.listOption = async(req, res) => {
    const { id } = req.params
    try {
        const result = await db.query(
            `
            select 
              ci.id, 
              ci.car_type, 
              cut.code_usage,
              ci.total 
            from compulsory_insurance as ci 
            left join car_usage_type as cut on ci.car_usage_type_id = cut.id
            left join car_usage as cu on cut.car_usage_id = cu.id
            where cu.id = $1 and ci.is_active = true
            order by ci.id asc
            `
            ,[id])

        console.log(result.rows)
        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listOptionPackage = async(req, res) => {
    try {
        const result = await db.query(
            `
            select 
              ci.id, 
              ci.detail, 
              ci.code_sub 
            from compulsory_insurance as ci 
            where ci.is_active = true
            order by ci.id asc
            `
            )

        console.log(result.rows)
        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req,res)=>{
    try {
        const { id } = req.params
        const result = await db.query(
            `
            select 
              ci.id, 
              ci.car_type, 
              ci.car_usage_type_id,
              ci.code_sub, 
              ci.detail, 
              ci.net_price,
              ci.vat, 
              ci.stamp, 
              ci.total
            from compulsory_insurance as ci 
            left join car_usage_type as cut on ci.car_usage_type_id = cut.id
            where ci.id = $1
            `
            , [id])

        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
    const { car_type, car_usage_type_id, code_sub, detail, net_price, vat, stamp, total } = req.body;
    const { id } = req.params;

    try {
        await db.query(
            `
            update compulsory_insurance 
            set 
                car_type = coalesce($1, car_type),
                car_usage_type_id = coalesce($2, car_usage_type_id), 
                code_sub = coalesce($3, code_sub),
                detail = coalesce($4, detail),
                net_price = coalesce($5, net_price),
                vat = coalesce($6, vat),
                stamp = coalesce($7, stamp), 
                total = coalesce($8, total) 
            WHERE id = $9
            `,
            [
                car_type                    ?? null,
                Number(car_usage_type_id)   ?? null,
                code_sub                    ?? null,
                detail                      ?? null,
                net_price                   ?? null,
                vat                         ?? null,
                stamp                       ?? null,
                total                       ?? null,
                id
            ]
        )

        res.json({msg: 'แก้ไข พ.ร.บ. รถสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.statusCompulsory = async(req, res) => {
    try {
        const { is_active } = req.body;
        const { id } = req.params;

        await db.query('update compulsory_insurance set is_active = $1 where id = $2', [is_active, id])

        res.json({msg: 'อัปเดตสถานะสำเร็จ'}) 
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM compulsory_insurance WHERE id = $1', [id])

        res.json({msg: 'ลบ พ.ร.บ. รถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}