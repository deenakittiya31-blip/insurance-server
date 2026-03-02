const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { full_name, address_line, phone, subdistrict, district, province, zipcode, member_id } = req.body

        await db.query('insert into address(full_name, address_line, phone, subdistrict, district, province, zipcode, member_id) values($1, $2, $3, $4, $5, $6, $7, $8)', [full_name, address_line, phone, subdistrict, district, province, zipcode, member_id])

        res.json({ msg: 'เพิ่มข้อมูลที่อยู่สำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}
exports.list = async(req, res) => {
    try {
        const result = await db.query(
            `
            SELECT id, full_name, address_line, phone, subdistrict, district, province, zipcode, member_id
            FROM address 
           WHERE member_id = $1
            `, [req.user.id])


        res.json({ data: result.rows });
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.read = async(req, res) => {
    try {
        const {id} = req.params
        
        const result = await db.query('SELECT id, full_name, address_line, phone, subdistrict, district, province, zipcode FROM address WHERE id = $1', [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}
exports.update = async(req, res) => {
    try {
        const { full_name, address_line, phone, subdistrict, district, province, zipcode } = req.body
        const { id } = req.params

        const existing = await db.query('SELECT * FROM  address WHERE id = $1',[id])

        const address = existing.rows[0]

        await db.query('UPDATE address SET full_name = $2, address_line = $3, phone = $4, subdistrict = $5, district = $6, province = $7, zipcode = $8 WHERE id = $1', 
          [
            id,
            full_name       ?? address.full_name,           
            address_line    ?? address.address_line, 
            phone           ?? address.phone, 
            subdistrict     ?? address.subdistrict,           
            district        ?? address.district, 
            province        ?? address.province, 
            zipcode         ?? address.zipcode,           
          ])

        res.json({msg: 'แก้ไขที่อยู่สำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.remove = async(req, res) => {
    try {
        const { id } = req.params

        await db.query('delete from address where id = $1', [id])

        res.json({msg: 'ลบข้อมูลที่อยู่สำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}