const connection = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { name, logo_url, logo_public_id } = req.body

      await connection.query(
      `INSERT INTO car_brand (name, logo_url, logo_public_id)
       VALUES (?, ?, ?)`,
      [name, logo_url, logo_public_id]
    )

    res.json({ msg: 'เพิ่มยี่ห้อรถสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const [rows] = await connection.query('SELECT id, name, logo_url, logo_public_id FROM car_brand')

        res.json({ data: rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const [rows] = await connection.query('SELECT id, name FROM car_brand')

        res.json({ data: rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, name, logo_url, logo_public_id FROM insurance.car_brand WHERE id = ?'
        const [row] = await connection.query(query, [Number(id)])

         res.json({ data: row[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const { name, logo_url, logo_public_id } = req.body;
    const { id } = req.params;

    try {
        const [rows] = await connection.query('SELECT * FROM  car_brand WHERE id = ?',[id])

        await connection.query('UPDATE car_brand SET name = ?, logo_url = ?, logo_public_id = ?  WHERE id = ?', 
          [
            name            ?? rows[0].name,           
            logo_url        ?? rows[0].logo_url, 
            logo_public_id  ?? rows[0].logo_public_id, 
            id

          ])

        res.json({msg: 'แก้ไขยี่ห้อรถสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        console.log(id)
        await connection.query('DELETE FROM car_brand WHERE id = ?', [id])

        res.json({msg: 'ลบยี่ห้อรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}