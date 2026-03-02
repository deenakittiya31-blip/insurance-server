const db = require('../config/database')

exports.create = async (req, res) => {
    const { compare_id, package_id, premium_id, member_id } = req.body

    const result = await db.query(
        `INSERT INTO premium_on_order 
         (compare_id, package_id, premium_id, member_id, status, expired_at)
         VALUES ($1, $2, $3, $4, 'pending', now() + interval '30 minutes')
         RETURNING id`,
        [compare_id, package_id, premium_id, member_id]
    )

    res.json({ order_id: result.rows[0].id })
}