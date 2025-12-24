const connection = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { car_type_id, price, coverage_detail } = req.body

        await connection.query('INSERT INTO compulsory_insurance (car_type_id, price, coverage_detail) VALUES (?, ?, ?)', 
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
        const [rows] = await connection.query('SELECT ci.id, ct.type, price, coverage_detail FROM insurance.compulsory_insurance as ci INNER JOIN insurance.car_type as ct ON ci.car_type_id = ct.id')

        if(rows.length === 0){
            return res.json({ data: [] })
        }

        res.json({data: rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req,res)=>{
    try {
        const { id } = req.params
        const [rows] = await connection.query('SELECT ci.id, ci.car_type_id, ct.type, price, coverage_detail FROM insurance.compulsory_insurance as ci INNER JOIN insurance.car_type as ct ON ci.car_type_id = ct.id WHERE ci.id = ?', [id])

        if(rows.length === 0){
            return res.json({ data: 'no data' })
        }

        res.json({data: rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server error'})
    }
}

exports.update = async(req, res) => {
    const { car_type_id, price, coverage_detail } = req.body;
    const { id } = req.params;

    try {
        const [rows] = await connection.query('SELECT * FROM  compulsory_insurance WHERE id = ?',[id])

        await connection.query('UPDATE compulsory_insurance SET car_type_id = ?, price = ?, coverage_detail = ? WHERE id = ?', [
             parseInt(car_type_id)   ?? rows[0].car_type_id,
             parseInt(price)         ?? rows[0].price,
             coverage_detail         ?? rows[0].coverage_detail,
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
        await connection.query('DELETE FROM compulsory_insurance WHERE id = ?', [id])

        res.json({msg: 'ลบ พ.ร.บ. รถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}