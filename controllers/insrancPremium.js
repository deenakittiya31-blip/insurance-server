const connection = require('../config/database');

exports.create = async(req, res) => {
    try {
        const { package_id, car_usage_id, car_year, premium_price, compulsory_price } = req.body

        const query = 'INSERT INTO insurance_premium(package_id, car_usage_id, car_year, premium_price, compulsory_price) VALUES(?, ?, ?, ?, ?)';

        await connection.query(query, [package_id, car_usage_id, car_year, premium_price, compulsory_price])

        res.json({ msg: 'เพิ่มข้อมูลเบี้ยประกันสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const query = 'SELECT ip.id, ipk.package_name as package, cu.usage_name, ip.car_year as year, ip.premium_price as premium, ip.compulsory_price as compulsory FROM insurance.insurance_premium as ip INNER JOIN insurance.insurance_package as ipk ON ip.package_id = ipk.id INNER JOIN insurance.car_usage as cu ON ip.car_usage_id = cu.id'
        const [row] = await connection.query(query)

         res.json({ data: row })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, package_id, car_usage_id, car_year, premium_price, compulsory_price FROM insurance.insurance_premium WHERE id = ?'
        const [row] = await connection.query(query, [parseInt(id)])

         res.json({ data: row[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {package_id, car_usage_id, car_year, premium_price, compulsory_price} = req.body

    try {
        const [rows] = await connection.query('SELECT * FROM  insurance_premium WHERE id = ?',[id])

        await connection.query('UPDATE  insurance_premium SET package_id = ?, car_usage_id = ?, car_year = ?, premium_price = ?, compulsory_price = ?  WHERE id = ?', 
            [
                parseInt(package_id)         || rows[0].package_id,
                parseInt(car_usage_id)       || rows[0].car_usage_id,
                parseInt(car_year)           || rows[0].car_year,
                parseInt(premium_price)      || rows[0].premium_price,
                parseInt(compulsory_price)   || rows[0].compulsory_price,
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

         await connection.query('DELETE FROM insurance_premium WHERE id = ?', [id])

         res.json({msg: 'ลบข้อมูลเบี้ยประกันสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}