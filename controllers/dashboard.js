const db = require('../config/database')

exports.dashboard = async (req, res) => {
    try {
        const [customers, sales, monthlySales, summary] = await Promise.all([
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
                WHERE status != 'รอดำเนินการ'
                GROUP BY status
                ORDER BY count DESC
            `),
            //ยอดขายรายเดือน
             db.query(`
                SELECT
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                    COUNT(*)                                              AS count,
                    SUM(selling_price)                                    AS total_selling_price,
                    SUM(selling_price - COALESCE(discount_price, 0))     AS net_revenue
                FROM premium_on_order
                WHERE created_at >= NOW() - INTERVAL '12 months'
                AND status != 'รอดำเนินการ'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at) ASC
            `),
            //รายได้ทั้งหมด + เดือนนี้
            db.query(`
                SELECT
                    SUM(selling_price)                                        AS total_all_time,
                    SUM(selling_price - COALESCE(discount_price, 0))         AS net_revenue_all_time,
                    SUM(selling_price) FILTER (
                        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
                    )                                                         AS total_this_month,
                    SUM(selling_price - COALESCE(discount_price, 0)) FILTER (
                        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
                    )                                                         AS net_revenue_this_month
                FROM premium_on_order
                WHERE status != 'รอดำเนินการ'
            `)
            ]);

            const raw = customers.rows[0];
            const rawSummary = summary.rows[0];

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
            monthly_sales: monthlySales.rows.map(row => ({
                month:               row.month,   // "2025-01", "2025-02", ...
                count:               parseInt(row.count),
                total_selling_price: parseFloat(row.total_selling_price) || 0,
                net_revenue:         parseFloat(row.net_revenue) || 0
            })),
            revenue: {
                total_all_time:        parseFloat(rawSummary.total_all_time)        || 0,
                net_revenue_all_time:  parseFloat(rawSummary.net_revenue_all_time)  || 0,
                total_this_month:      parseFloat(rawSummary.total_this_month)      || 0,
                net_revenue_this_month:parseFloat(rawSummary.net_revenue_this_month)|| 0,
            },
            updatedAt: new Date()
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error'})
    }
};