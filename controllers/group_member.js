const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { group_name } = req.body

        await db.query('insert into group_member (group_name) values ($1)', [group_name])

        res.json({msg: 'สร้างกลุ่มลูกค้าสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}
exports.list = async(req, res) => {
    try {
        const result = await db.query('select * from group_member order by desc')

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}
exports.update = async(req, res) => {
    try {
        const { group_name } = req.body
        const { id } = req.params

        await db.query('update group_member set group_name = $1 where id = $2', [group_name, id])

        res.json({msg: 'แก้ไขชื่อกลุ่มสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}
exports.remove = async(req, res) => {
    try {
        const { id } = req.params

        await db.query('delete from group_member where id = $1', [id])

        res.json({msg: 'ลบกลุ่มลูกค้าสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}