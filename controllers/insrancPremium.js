const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { package_id, car_usage_id, car_year, premium_price, compulsory_price } = req.body

        const query = 'INSERT INTO insurance_premium(package_id, car_usage_id, car_year, premium_price, compulsory_price) VALUES($1, $2, $3, $4, $5)';

        await db.query(query, [package_id, car_usage_id, car_year, Number(premium_price), Number(compulsory_price)])

        res.json({ msg: 'เพิ่มข้อมูลเบี้ยประกันสำเร็จ' })
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
        const query = 'SELECT ip.id, ipk.package_name as package, cu.usage_name, ip.car_year as year, ip.premium_price as premium, ip.compulsory_price as compulsory, (ip.premium_price + ip.compulsory_price) as total FROM insurance_premium as ip INNER JOIN insurance_package as ipk ON ip.package_id = ipk.id INNER JOIN car_usage as cu ON ip.car_usage_id = cu.id ORDER BY ip.id ASC LIMIT $1 OFFSET $2'
        const result = await db.query(query, [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM insurance_premium')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, package_id, car_usage_id, car_year, premium_price, compulsory_price FROM insurance_premium WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {package_id, car_usage_id, car_year, premium_price, compulsory_price} = req.body

    try {
        const result = await db.query('SELECT * FROM  insurance_premium WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]

        await db.query('UPDATE  insurance_premium SET package_id = $1, car_usage_id = $2, car_year = $3, premium_price = $4, compulsory_price = $5  WHERE id = $6', 
            [
               package_id         !== undefined ? Number(package_id) :  old.package_id,
               car_usage_id       !== undefined ? Number(car_usage_id) :  old.car_usage_id,
               car_year           !== undefined ? Number(car_year) :  old.car_year,
               premium_price      !== undefined ? Number(premium_price) :  old.premium_price,
               compulsory_price   !== undefined ? Number(compulsory_price) :  old.compulsory_price,
               id
            ])

        res.json({msg: 'อัปเดตข้อมูลเบี้ยประกันสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
         const {id} = req.params

         await db.query('DELETE FROM insurance_premium WHERE id = $1', [id])

         res.json({msg: 'ลบข้อมูลเบี้ยประกันสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}