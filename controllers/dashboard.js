const db = require('../config/database')

exports.dashboard = async (req, res) => {
    try {
        const [customers, sales] = await Promise.all([
            db.query(`
                SELECT
                COUNT(*) FILTER (WHERE is_friend = true)     AS friends,
                COUNT(*) FILTER (WHERE is_registered = true) AS registered,
                COUNT(*)                                      AS total
                FROM member
                WHERE is_active = true
            `),
            db.query(`
                SELECT
                status,
                COUNT(*)                                          AS count,
                SUM(selling_price)                                AS total_selling_price,
                SUM(selling_price - COALESCE(discount_price, 0)) AS net_revenue
                FROM premium_on_order
                GROUP BY status
                ORDER BY count DESC
            `)
            ]);

            const raw = customers.rows[0];

            res.json({
            customers: {
                friends:    parseInt(raw.friends),
                registered: parseInt(raw.registered),
                total:      parseInt(raw.total)
            },
            sales: sales.rows.map(row => ({
                status:              row.status,
                count:               parseInt(row.count),
                total_selling_price: parseFloat(row.total_selling_price) || 0,
                net_revenue:         parseFloat(row.net_revenue) || 0
            })),
            updatedAt: new Date()
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error'})
    }
};