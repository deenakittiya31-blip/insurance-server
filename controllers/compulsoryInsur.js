const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { car_type_id, code, net_price, vat, stamp, total, detail } = req.body

        await db.query('INSERT INTO compulsory_insurance (car_type_id, code, net_price, vat, stamp, total, detail) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
                            [
                                Number(car_type_id), 
                                code,
                                Number(net_price), 
                                Number(vat), 
                                Number(stamp), 
                                Number(total), 
                                detail
                            ]
                       );

        res.json({ msg: 'เพิ่ม พ.ร.บ. รถสำเร็จ' })
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
        const result = await db.query('SELECT ci.id, ct.type, ci.code, net_price, vat, stamp, total, detail FROM compulsory_insurance as ci INNER JOIN car_type as ct ON ci.car_type_id = ct.id ORDER BY ci.id ASC LIMIT $1 OFFSET $2', [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM compulsory_insurance')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listOption = async(req, res) => {
    const { id } = req.params
    try {
        const result = await db.query('SELECT ci.id, ct.type, ct.code, total FROM compulsory_insurance as ci INNER JOIN car_type as ct ON ci.car_type_id = ct.id join car_usage as cu on ct.car_usage_id = cu.id where ct.car_usage_id = $1',[id])

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
        const result = await db.query('SELECT ci.id, ci.car_type_id, ct.type, ci.code, net_price, vat, stamp, total, detail FROM compulsory_insurance as ci INNER JOIN car_type as ct ON ci.car_type_id = ct.id WHERE ci.id = $1', [id])


        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
    const { car_type_id, code, net_price, vat, stamp, total, detail } = req.body;
    const { id } = req.params;

    try {
        await db.query('UPDATE compulsory_insurance SET car_type_id = COALESCE($1, car_type_id), code = COALESCE($2, code), net_price = COALESCE($3, net_price), vat = COALESCE($4, vat), stamp = COALESCE($5, stamp), total = COALESCE($6, total), detail = COALESCE($7, detail) WHERE id = $8',
            [
                car_type_id ?? null,
                code ?? null,
                net_price ?? null,
                vat ?? null,
                stamp ?? null,
                total ?? null,
                detail ?? null,
                id
            ]
        )

        res.json({msg: 'แก้ไข พ.ร.บ. รถสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        console.log(id)
        await db.query('DELETE FROM compulsory_insurance WHERE id = $1', [id])

        res.json({msg: 'ลบ พ.ร.บ. รถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}