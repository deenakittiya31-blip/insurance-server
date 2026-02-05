const db = require('../config/database')
const cloudinary = require('../config/cloudinary')

exports.create = async(req, res) => {
    try {
        const { group_name } = req.body

        await db.query('insert into group_member (group_name, head_url, head_public_id) values ($1, $2, $3)', [group_name])

        res.json({msg: 'สร้างกลุ่มลูกค้าสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.list = async(req, res) => {
    try {
        const result = await db.query('select * from group_member order by id desc')

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.read = async(req, res) => {
    try {  
        const {id} = req.params

        const result = await db.query('SELECT id, group_name, head_url, head_public_id FROM group_member WHERE id = $1', [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    try {
        const { group_name, head_logo, head_public_id } = req.body
        const { id } = req.params

        const existing = await db.query('select * from group_member where id = $1', [id])

        const oldGroup = existing.rows[0]

        await db.query('update group_member set group_name = $1, head_url = $2, head_public_id = $3 where id = $4'
            , [
                group_name          ?? oldGroup.group_name, 
                head_logo           ?? oldGroup.head_logo, 
                head_public_id      ?? oldGroup.head_public_id,
                id
            ])

        res.json({msg: 'แก้ไขชื่อกลุ่มสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.remove = async(req, res) => {
    try {
        const { id } = req.params

        const result = await db.query('SELECT * FROM group_member WHERE id = $1', [id])

        if(result.rows.length === 0){
            return res.status(404).json({msg: 'ไม่เจอกลุ่มนี้'})
        }

        const {head_public_id} = result.rows[0]

        //2 ถ้ามี head_public_id ให้ลบรูปก่อน
        if(head_public_id){
            await cloudinary.uploader.destroy(head_public_id)
        }

        await db.query('delete from group_member where id = $1', [id])

        res.json({msg: 'ลบกลุ่มลูกค้าสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}