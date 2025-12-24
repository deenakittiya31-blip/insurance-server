const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { car_type_id, price, coverage_detail } = req.body

        await db.query('INSERT INTO compulsory_insurance (car_type_id, price, coverage_detail) VALUES ($1, $2, $3)', 
                                [Number(car_type_id), Number(price), coverage_detail]
                            );

        res.json({ msg: 'เพิ่ม พ.ร.บ. รถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const result = await db.query('SELECT ci.id, ct.type, price, coverage_detail FROM compulsory_insurance as ci INNER JOIN car_type as ct ON ci.car_type_id = ct.id')


        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req,res)=>{
    try {
        const { id } = req.params
        const result = await db.query('SELECT ci.id, ci.car_type_id, ct.type, price, coverage_detail FROM compulsory_insurance as ci INNER JOIN car_type as ct ON ci.car_type_id = ct.id WHERE ci.id = $1', [id])


        res.json({data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
    const { car_type_id, price, coverage_detail } = req.body;
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM compulsory_insurance WHERE id = $1', [id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]

        await db.query('UPDATE compulsory_insurance SET car_type_id = $1, price = $2, coverage_detail = $3 WHERE id = $4', [
            car_type_id     !== undefined ? Number(car_type_id) : old.car_type_id,
            price           !== undefined ? Number(price) : old.price,
            coverage_detail ?? old.coverage_detail,
        id
        ])

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