const db = require('../config/database');

exports.getActivePolicy = async (req, res) => {
    try {
        const { type } = req.params
        const result = await db.query(
            `SELECT * FROM policy WHERE policy_type = $1 AND is_active = TRUE`,
            [type]
        )
        res.json({ policy: result.rows[0] || null })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.getPolicyList = async (req, res) => {
    try {
        const { type } = req.params
        const result = await db.query(
            `SELECT * FROM policy WHERE policy_type = $1 ORDER BY created_at DESC`,
            [type]
        )
        res.json({ policies: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.createPolicy = async (req, res) => {
    try {
        const { policy_type, title_th, title_en, content_th, content_en, version } = req.body
        if (!policy_type || !title_th || !content_th || !version) {
            return res.status(400).json({ message: 'ข้อมูลไม่ครบ' })
        }
        const result = await db.query(
            `INSERT INTO policy (policy_type, title_th, title_en, content_th, content_en, version)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [policy_type, title_th, title_en, content_th, content_en, version]
        )
        res.json({ policy: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.updatePolicy = async (req, res) => {
    try {
        const { id } = req.params

        const { title_th, title_en, content_th, content_en, version } = req.body
        const result = await db.query(
            `UPDATE policy SET title_th=$1, title_en=$2, content_th=$3, content_en=$4, version=$5, updated_at=NOW()
             WHERE id = $6 RETURNING *`,
            [title_th, title_en, content_th, content_en, version, id]
        )
        res.json({ policy: result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.publishPolicy = async (req, res) => {
    try {
        const { id } = req.params

        const target = await db.query(`SELECT policy_type FROM policy WHERE id = $1`, [id])
        if (!target.rows[0]) return res.status(404).json({ message: 'ไม่พบข้อมูล' })

        const type = target.rows[0].policy_type

        await db.query('BEGIN')
        await db.query(`UPDATE policy SET is_active = FALSE WHERE policy_type = $1`, [type])
        await db.query(`UPDATE policy SET is_active = TRUE, published_at = NOW() WHERE id = $1`, [id])
        await db.query('COMMIT')

        res.json({ success: true })
    } catch (err) {
        await db.query('ROLLBACK')
        console.log(err)
        res.status(500).json({ message: 'Server error' })
    }
}

exports.deletePolicy = async (req, res) => {
    try {
        const { id } = req.params

        const check = await db.query(`SELECT is_active FROM policy WHERE id = $1`, [id])

        if (!check.rows[0]) return res.status(404).json({ message: 'ไม่พบข้อมูล' })

        if (check.rows[0].is_active) {
            return res.status(400).json({ message: 'ไม่สามารถลบ version ที่ใช้งานอยู่ได้' })
        }

        await db.query(`DELETE FROM policy WHERE id = $1`, [id])
        res.json({ success: true })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' })
    }
}