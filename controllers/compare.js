const db = require('../config/database');
const { generatePDF } = require('../utils/generatePDF');
const { groupQuotationData } = require('../utils/groupQuotationData');
const { generateJPG } = require('../utils/generateJPG');

exports.createCompare = async(req, res) => {
    try {
        const { to_name, details, car_brand_id, car_model_id, car_year_id, car_usage_id, offer, sub_car_model, import_by } = req.body;

        //สร้างเลข q_id
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const yearMonth = `${year}${month}` // 202601

       // 1. insert พร้อมข้อมูลรถ และเอา id ออกมา
        const insertResult = await db.query(
            `INSERT INTO quotation_compare(
                to_name, details, car_brand_id, car_model_id, car_year_id, car_usage_id, offer, sub_car_model, import_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id`,
            [
                to_name,
                details,
                Number(car_brand_id),
                car_model_id ? Number(car_model_id) : null,
                Number(car_year_id),
                Number(car_usage_id),
                offer,
                sub_car_model ?? null,
                import_by
            ]
        )

        const id = insertResult.rows[0].id
        const runningNumber = String(id).padStart(6, '0')
        const q_id = `Q${yearMonth}${runningNumber}`

        //update q_id
        await db.query(
            `UPDATE quotation_compare SET q_id = $1 WHERE id = $2`,
            [q_id, id]
        )

       res.json({
            q_id: q_id
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.listCompare = async(req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const per_page = Number(req.query.per_page || 5);
        const sortKey = req.query.sortKey || 'id';
        const sortDirection = req.query.sortDirection || 'DESC';
        const validSortDirection = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const offset = (page - 1) * per_page;

        const result = await db.query(
            `
            SELECT 
                qc.id,
                qc.q_id, 
                qc.created_at,
                qc.to_name,
                qc.details,
                cu.usage_name AS usage, 
                cy.year_be, 
                cy.year_ad,  
                cb.name AS car_brand, 
                cm.name AS car_model, 
                qc.sub_car_model,
                COALESCE(
                  JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'picture_url', m.picture_url,
                        'display_name', m.display_name,
                        'sent_at', hq.created_at
                    )
                  ) FILTER (WHERE m.user_id IS NOT NULL),
                 '[]'
                ) AS members
            FROM quotation_compare AS qc 
            LEFT JOIN car_brand AS cb ON qc.car_brand_id = cb.id 
            LEFT JOIN car_model AS cm ON qc.car_model_id = cm.id 
            LEFT JOIN car_usage AS cu ON qc.car_usage_id = cu.id 
            LEFT JOIN car_year AS cy ON qc.car_year_id = cy.id 
            LEFT JOIN history_send_quotation AS hq ON qc.q_id = hq.compare_id
            LEFT JOIN member AS m ON hq.member_id = m.user_id
            GROUP BY qc.id, qc.q_id, qc.created_at, qc.to_name, qc.details, 
            cu.usage_name, cy.year_be, cy.year_ad, cb.name, cm.name, qc.sub_car_model
            ORDER BY ${sortKey} ${validSortDirection} 
            LIMIT $1 OFFSET $2
            `,[per_page, offset]
        )

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM quotation_compare')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.detailCompareEdite = async(req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `
            select 
              q.id as quotation_id, 
              q.company_id, 
              ic.namecompany as company_name, 
              ic.logo_url as company_logo, 
              qf.field_code, 
              qf.field_value 
            from quotation_compare as qc 
            join quotation as q on qc.q_id = q.compare_id 
            join quotation_field as qf on q.id = qf.quotation_id 
            join insurance_company as ic on q.company_id = ic.id 
            where qc.q_id = $1 
            order by q.id asc, qf.field_code asc
            `, [id]
        )

        const grouped = groupQuotationData(result.rows);

        res.json({ data: grouped.insurances })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.removeCompare = async(req, res) => {
    try {
        const {id} = req.params

        await db.query('DELETE FROM quotation_compare WHERE id = $1', [id])

        res.json({msg: 'ลบสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.getDetailCompare = async(req, res) => {
    try {
        const { id } = req.params

        // ตรวจสอบว่ามีข้อมูลในตาราง quotation_compare ก่อน
        const checkExist = await db.query(
            'SELECT * FROM quotation_compare WHERE q_id = $1',
            [id]
        )

        console.log('Found records:', checkExist.rows.length)
        if (checkExist.rows.length > 0) {
            console.log('Record data:', checkExist.rows[0])
        }

        if (checkExist.rows.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบข้อมูล' })
        }

        const result = await db.query(
            'select qc.q_id, qc.to_name, qc.details, cu.id as usageid, cu.usage_name as usage, cy.year_be, cy.year_ad, cb.logo_url, cb.name as car_brand, cm.name as car_model, qc.sub_car_model from quotation_compare as qc left join car_brand as cb on qc.car_brand_id = cb.id left join car_model as cm on qc.car_model_id = cm.id left join car_usage as cu on qc.car_usage_id = cu.id left join car_year as cy on qc.car_year_id = cy.id where qc.q_id::text = $1',[id])

        res.json({ data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({ msg : 'Server error'})
    }
}

exports.comparePDF = async(req, res) => {
    try {
        const { id } = req.params;

        //รอบแรก query ข้อมูลรถ
        const carResult = await db.query(`
            select 
              qc.q_id, 
              qc.to_name, 
              qc.details, 
              qc.offer, 
              qc.created_at AT TIME ZONE 'Asia/Bangkok' AS created_at_th,
              cb.name as car_brand,
              COALESCE(cm.name, qc.sub_car_model) as car_model,
              cu.usage_name as usage, 
              cy.year_be, cy.year_ad
            from quotation_compare as qc 
            join car_brand as cb on qc.car_brand_id = cb.id 
            left join car_model as cm on qc.car_model_id = cm.id
            join car_usage as cu on qc.car_usage_id = cu.id 
            join car_year as cy on qc.car_year_id = cy.id
            where qc.q_id = $1`, [id])

        if (!carResult.rows.length) {
            return res.status(404).json({ msg: 'ไม่พบข้อมูลรถ' });
        }

        //รอบสอง query ข้อมูลเอกสาร
        const quotationResult = await db.query(`select q.id AS quotation_id, q.company_id, ic.namecompany AS company_name, ic.logo_url AS company_logo, qf.field_code, qf.field_value from quotation_compare as qc INNER JOIN quotation AS q ON qc.q_id = q.compare_id left join quotation_field as qf on q.id = qf.quotation_id LEFT JOIN insurance_company AS ic ON q.company_id = ic.id where qc.q_id = $1 ORDER BY q.id ASC, qf.field_code ASC`, [id])

         // ตรวจสอบว่ามีข้อมูลไหม
        if (!quotationResult.rows.length) {
            return res.status(404).json({ 
                success: false,
                msg: 'ไม่พบข้อมูลบริษัทประกัน' 
            });
        }

        //จัดกรุ๊ปข้อมูล
        const grouped = groupQuotationData(quotationResult.rows);
        const carData = carResult.rows[0];
       
           //สร้าง PDF
        await generatePDF(res, carData, grouped.insurances, id);

    } catch (err) {
        console.log(err)
        if (!res.headersSent) {
            res.status(500).json({ msg: 'Server error' });
        }
    }
}

exports.compareJPG = async(req, res) => {
    try {
        const { id } = req.params;

        //รอบแรก query ข้อมูลรถ
        const carResult = await db.query(
            `
            select 
              qc.q_id, 
              qc.to_name, 
              qc.details, 
              qc.offer, 
              qc.created_at AT TIME ZONE 'Asia/Bangkok' AS created_at_th,
              cb.name as car_brand,
              COALESCE(cm.name, qc.sub_car_model) as car_model,
              cu.usage_name as usage, 
              cy.year_be, cy.year_ad
            from quotation_compare as qc 
            join car_brand as cb on qc.car_brand_id = cb.id 
            left join car_model as cm on qc.car_model_id = cm.id
            join car_usage as cu on qc.car_usage_id = cu.id 
            join car_year as cy on qc.car_year_id = cy.id
            where qc.q_id = $1`, [id])

        if (!carResult.rows.length) {
            return res.status(404).json({ msg: 'ไม่พบข้อมูลรถ' });
        }

        //รอบสอง query ข้อมูลเอกสาร
        const quotationResult = await db.query(`select q.id AS quotation_id, q.company_id, ic.namecompany AS company_name, ic.logo_url AS company_logo, qf.field_code, qf.field_value from quotation_compare as qc INNER JOIN quotation AS q ON qc.q_id = q.compare_id left join quotation_field as qf on q.id = qf.quotation_id LEFT JOIN insurance_company AS ic ON q.company_id = ic.id where qc.q_id = $1 ORDER BY q.id ASC, qf.field_code ASC`, [id])

         // ตรวจสอบว่ามีข้อมูลไหม
        if (!quotationResult.rows.length) {
            return res.status(404).json({ 
                success: false,
                msg: 'ไม่พบข้อมูลบริษัทประกัน' 
            });
        }

        //จัดกรุ๊ปข้อมูล
        const grouped = groupQuotationData(quotationResult.rows);

        const buffer = await generateJPG({
            carData: carResult.rows[0],
            insurances: grouped.insurances,
            qId: id
        });

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=quotation_${id}.jpg`
        );

        res.end(buffer);


    } catch (err) {
        console.log(err)
        if (!res.headersSent) {
            res.status(500).json({ msg: 'Server error' });
        }
    }
}

exports.searchCompare = async(req, res) => {
    try {
        const { search } = req.body;

        const result = await db.query(
            `
            SELECT 
              qc.id,
              qc.q_id, 
              qc.created_at,
              qc.to_name,
              qc.details,
              cu.usage_name as usage, 
              cy.year_be, cy.year_ad,  
              cb.name as car_brand, 
              cm.name as car_model, 
              qc.sub_car_model
            FROM quotation_compare AS qc
            left join car_brand as cb on qc.car_brand_id = cb.id 
            left join car_model as cm on qc.car_model_id = cm.id 
            left join car_usage as cu on qc.car_usage_id = cu.id 
            left join car_year as cy on qc.car_year_id = cy.id 
            WHERE
                qc.q_id ILIKE $1 OR
                qc.to_name ILIKE $1 OR
                qc.details ILIKE $1 OR
                qc.offer ILIKE $1 OR
                cu.usage_name ILIKE $1 OR
                cy.year_be::text ILIKE $1 OR
                cy.year_ad::text ILIKE $1 OR
                cb.name ILIKE $1 OR
                cm.name ILIKE $1 OR
                qc.sub_car_model ILIKE $1 
            ORDER BY qc.created_at DESC
            `,
            [`%${search}%`]
        );

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

