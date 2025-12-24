const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { nameType, description } = req.body

        const query = 'INSERT INTO insurance_type(nameType, description) VALUES($1, $2)';

        await db.query(query, [nameType, description])
        res.json({ msg: 'เพิ่มข้อมูลสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const result = await db.query('SELECT id, nameType, description FROM insurance_type')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, nameType FROM insurance_type')

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    const {id} = req.params

    try {
         const query = 'SELECT id, nameType, description FROM insurance.insurance_type WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
         console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const { nameType, description } = req.body;

    try {
        const result = await db.query('SELECT * FROM  insurance_type WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]

        await db.query('UPDATE insurance_type SET nameType = $1, description=$2 WHERE id = $3', 
            [
                nameType     !== undefined ? nameType     : old.nameType,  
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