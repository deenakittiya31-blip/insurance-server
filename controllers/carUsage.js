const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { usage } = req.body

        await db.query('INSERT INTO car_usage (usage_name) VALUES ($1)', [usage]);

        res.json({ msg: 'เพิ่มประเภทการใช้งานรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.per_page) || 5;

    const offset = (page - 1) * per_page

    try {
        const result = await db.query('SELECT id, usage_name FROM car_usage ORDER BY id ASC LIMIT $1 OFFSET $2', [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_usage')

        res.json({data: result.rows, total: countResult.rows[0].total})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, usage_name FROM car_usage')

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
        const { code, car_type_id, car_usage_id, code_usage } = req.body

        await db.query('INSERT INTO car_usage_type (code, car_type_id, car_usage_id, code_usage) VALUES ($1, $2, $3, $4)'
                        , [
                            code, 
                            Number(car_type_id), 
                            Number(car_usage_id), 
                            code_usage
                        ]);

        res.json({ msg: 'เพิ่มประเภทการใช้งานรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listUsageType = async(req, res) => {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.per_page) || 5;

    const offset = (page - 1) * per_page

    try {
        const result = await db.query(
            `
            SELECT cut.id, cut.code, ct.type AS car_type, cu.usage_name, cut.code_usage
            FROM car_usage_type AS cut
            JOIN car_type AS ct ON cut.car_type_id = ct.id
            JOIN car_usage AS cu ON cut.car_usage_id = cu.id
            ORDER BY cut.id ASC LIMIT $1 OFFSET $2`, 
            [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_usage_type')

        res.json({data: result.rows, total: countResult.rows[0].total})
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
         const { code, car_type_id, car_usage_id, code_usage } = req.body;

        await db.query(
                `
                UPDATE car_usage_type 
                SET 
                    code = coalesce ($1, code),
                    car_type_id = coalesce ($2, car_type_id),
                    car_usage_id = coalesce ($3, car_usage_id),
                    code_usage = coalesce ($4, code_usage),
                WHERE id = $5`
                , [
                    code, 
                    Number(car_type_id), 
                    Number(car_usage_id), 
                    code_usage,
                    id
                  ])

        res.json({msg: 'แก้ไขประเภทการใช้งานรถสำเร็จ'})  
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
