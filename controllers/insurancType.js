const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { nametype, description } = req.body

        const query = 'INSERT INTO insurance_type(nametype, description) VALUES($1, $2)';

        await db.query(query, [nametype, description])
        res.json({ msg: 'เพิ่มข้อมูลสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.is_active = async(req, res) => {
    const {is_active} = req.body
    const {id} = req.params

    try {
            await db.query('UPDATE insurance_type SET is_active = $1 WHERE id = $2', 
            [is_active, id])

        res.json({msg: 'อัปเดตข้อมูลประเภทประกันสำเร็จ'})  
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
        const result = await db.query('SELECT id, nametype, description FROM insurance_type ORDER BY id ASC LIMIT $1 OFFSET $2',[per_page, offset])

         const countResult = await db.query('SELECT COUNT(*)::int as total FROM insurance_type')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, nametype FROM insurance_type')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    const {id} = req.params

    try {
         const query = 'SELECT id, nametype, description FROM insurance_type WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
         console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const { nametype, description } = req.body;

    try {
        const result = await db.query('SELECT * FROM  insurance_type WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]

        await db.query('UPDATE insurance_type SET nametype = $1, description=$2 WHERE id = $3', 
            [
                nametype     !== undefined ? nametype     : old.nametype,  
                description  !== undefined ? description  : old.description,  
                id
            ])

        res.json({msg: 'อัปเดตข้อมูลประเภทประกันสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM insurance_type WHERE id = $1', [id])

        res.json({msg: 'ลบสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}