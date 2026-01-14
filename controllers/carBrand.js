const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { name, logo_url, logo_public_id } = req.body

      await db.query(
      `INSERT INTO car_brand (name, logo_url, logo_public_id)
       VALUES ($1, $2, $3)`,
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
        const page = Number(req.query.page) || 1;
        const per_page = Number(req.query.per_page) || 5;

        const offset = (page - 1) * per_page
        const result = await db.query('SELECT id, name, logo_url, logo_public_id FROM car_brand ORDER BY id ASC LIMIT $1 OFFSET $2', [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM car_brand')
        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, name FROM car_brand order by id')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params
        
        const query = 'SELECT id, name, logo_url, logo_public_id FROM car_brand WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const { name, logo_url, logo_public_id } = req.body;
    const { id } = req.params;

    try {
        const existing = await db.query('SELECT * FROM  car_brand WHERE id = $1',[id])

        const brand = existing.rows[0]

        await db.query('UPDATE car_brand SET name = $1, logo_url = $2, logo_public_id = $3  WHERE id = $4', 
          [
            name            ?? brand.name,           
            logo_url        ?? brand.logo_url, 
            logo_public_id  ?? brand.logo_public_id, 
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
        await db.query('DELETE FROM car_brand WHERE id = $1', [id])

        res.json({msg: 'ลบยี่ห้อรถสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}