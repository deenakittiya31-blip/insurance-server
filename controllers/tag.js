const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { tag_name } = req.body

        await db.query('INSERT INTO tag(tag_name) VALUES($1)', [tag_name])

        res.json({ msg: 'เพิ่มป้ายกำกับสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.addMembers = async(req, res) => {
    try {
        const { tag_id, members } = req.body

        for(const userId of members) {
            await db.query('INSERT INTO tag_member(tag_id, member_id) VALUES($1, $2)', [Number(tag_id), userId])
        }
      

        res.json({ msg: 'เพิ่มเพิ่มสมาชิกเข้าป้ายกำกับสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.removeTagFromMember = async(req, res) => {
    try {
        const { id } = req.params

        await db.query('DELETE FROM tag_member WHERE id = $1', [Number(id)])
      
        res.json({ msg: 'ลบป้ายกำกับสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const per_page = Number(req.query.per_page) || 5;
        const sortKey = req.query.sortKey || 'id';
        const sortDirection = req.query.sortDirection || 'DESC';
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const offset = (page - 1) * per_page;

        const result = await db.query(`SELECT id, tag_name, is_active FROM tag ORDER BY ${sortKey} ${validSortDirection} LIMIT $1 OFFSET $2`, [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM tag')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query('SELECT id, tag_name FROM tag WHERE is_active = true ORDER BY id DESC')
         if (result.rows.length === 0) {
            return res.json({ data: [] })
        }

        res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server errer'})
    }
}

exports.update = async(req, res) => {
    const { tag_name } = req.body;
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM tag WHERE id = $1', [id])

        const old = result.rows[0]

        await db.query('UPDATE tag SET tag_name = $1 WHERE id = $2', 
            [
                tag_name     ?? old.tag_name, 
                id
            ])

        res.json({msg: 'แก้ไขป้ายกำกับสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.is_active = async(req, res) => {
    try {
        const {is_active} = req.body
        const {id} = req.params

        await db.query('UPDATE tag SET is_active = $1 WHERE id = $2', 
        [is_active, id])

        res.json({msg: 'อัปเดตป้ายกำกับสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'})
    }
}

exports.remove = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM tag WHERE id = $1', [id])

        res.json({msg: 'ลบป้ายกำกับสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}