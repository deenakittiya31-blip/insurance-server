const db = require('../config/database');
const { generatePDF } = require('../utils/generatePDF');
const { groupQuotationData } = require('../utils/groupQuotationData');

exports.createCompare = async(req, res) => {
    try {
        const { to_name, details, car_brand_id, car_model_id, car_year_id, car_usage_id, offer } = req.body;

        //สร้างเลข q_id
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')

        const yearMonth = `${year}${month}` // 202601

        const countResult = await db.query(
            `SELECT COUNT(*) FROM quotation_compare WHERE q_id LIKE $1`,
            [`Q${yearMonth}%`]
        )

        const running = Number(countResult.rows[0].count) + 1
        const runningNumber = String(running).padStart(6, '0')
        const q_id = `Q${yearMonth}${runningNumber}`

       // 1. insert พร้อมข้อมูลรถ และเอา id ออกมา
        const insertResult = await db.query(
            'INSERT INTO quotation_compare(q_id, to_name, details, car_brand_id, car_model_id, car_year_id, car_usage_id, offer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING q_id',
            [
                q_id,
                to_name,
                details,
                Number(car_brand_id),
                Number(car_model_id),
                Number(car_year_id),
                Number(car_usage_id),
                offer
            ]
        )

       res.json({
            q_id: insertResult.rows[0].q_id
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.getDetailCompare = async(req, res) => {
    try {
        const { id } = req.params

        console.log('Received ID:', id, typeof id)

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

        const result = await db.query('select qc.q_id, cb.name as car_brand, cm.name as car_model, cu.id as usageId, cu.usage_name as usage, cy.year_be, cy.year_ad from quotation_compare as qc join car_brand as cb on qc.car_brand_id = cb.id join car_model as cm on qc.car_model_id = cm.id join car_usage as cu on qc.car_usage_id = cu.id join car_year as cy on qc.car_year_id = cy.id where qc.q_id::text = $1',[id])


        console.log('ข้อมูลที่ใช้ในการดึง ocr : ',result.rows[0])

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
        const carResult = await db.query(`select qc.q_id, qc.to_name, qc.details, qc.offer, qc.created_at AT TIME ZONE 'Asia/Bangkok' AS created_at_th, cb.name as car_brand, cm.name as car_model, cu.usage_name as usage, cy.year_be, cy.year_ad from quotation_compare as qc join car_brand as cb on qc.car_brand_id = cb.id join car_model as cm on qc.car_model_id = cm.id join car_usage as cu on qc.car_usage_id = cu.id join car_year as cy on qc.car_year_id = cy.id where qc.q_id = $1`, [id])

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
        await generatePDF({
            carData,
            insurances: grouped.insurances,
            qId: id,
            output: {
                type: 'stream',
                res
            }
        });

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
        const carResult = await db.query(`select qc.q_id, qc.to_name, qc.details, qc.offer, qc.created_at AT TIME ZONE 'Asia/Bangkok' AS created_at_th, cb.name as car_brand, cm.name as car_model, cu.usage_name as usage, cy.year_be, cy.year_ad from quotation_compare as qc join car_brand as cb on qc.car_brand_id = cb.id join car_model as cm on qc.car_model_id = cm.id join car_usage as cu on qc.car_usage_id = cu.id join car_year as cy on qc.car_year_id = cy.id where qc.q_id = $1`, [id])

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
        await pdfToJpg(pdfPath, imageDir);

    } catch (err) {
        console.log(err)
        if (!res.headersSent) {
            res.status(500).json({ msg: 'Server error' });
        }
    }
}

