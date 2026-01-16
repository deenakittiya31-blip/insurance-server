const db = require('../config/database')

exports.createModelAndFields = async(req, res) => {
    try {
        console.log('crate Model hello')
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.listModel = async(req, res) => {
    try {
        const page = Number(req.query.page) || 1
        const per_page = Number(req.query.per_page) || 5
        const offset = (page - 1) * per_page

        const result = await db.query(`select distinct ct.company_id, ic.namecompany from company_theme as ct join insurance_company as ic on ct.company_id = ic.id ORDER BY ct.company_id LIMIT $1 OFFSET $2`, [per_page, offset])
        
        const countResult = await db.query(`select count(distinct ct.company_id) as total_company from company_theme ct join insurance_company ic on ct.company_id = ic.id;`)

        res.json({ data: result.rows, total: countResult.rows[0].total_company })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.removeModel = async(req, res) => {
    try {
        const {id} = req.params;

        await db.query('DELETE FROM company_theme WHERE company_id = $1', [id])

        res.json({msg: 'ลบโมเดลบริษัทสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.updateModelFields = async(req, res) => {
    try {
        console.log('updateModelFields hello')
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

