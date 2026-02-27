const db = require('../config/database');
const { generateJPG } = require('./generateJPG');
const { groupQuotationData } = require('./groupQuotationData');

exports.generateCompareJPG = async(q_id, publicCompare, modeSender = false) => {

        //รอบแรก query ข้อมูลรถ
        const carResult = await db.query(
            `
            select 
              qc.q_id, 
              qc.to_name, 
              qc.details, 
              us.name as offer, 
              qc.created_at AT TIME ZONE 'Asia/Bangkok' AS created_at_th,
              cb.name as car_brand,
              COALESCE(cm.name, qc.sub_car_model) as car_model,
              cu.usage_name as usage, 
              cy.year_be, cy.year_ad
            from quotation_compare as qc 
            left join car_brand as cb on qc.car_brand_id = cb.id 
            left join car_model as cm on qc.car_model_id = cm.id
            left join car_usage as cu on qc.car_usage_id = cu.id 
            left join car_year as cy on qc.car_year_id = cy.id
            left join users as us on qc.offer_id = us.user_id
            where qc.q_id = $1`, [q_id])

        //รอบสอง query ข้อมูลเอกสาร
        const quotationResult = await db.query(`select q.id AS quotation_id, q.company_id, ic.namecompany AS company_name, ic.logo_url AS company_logo, qf.field_code, qf.field_value from quotation_compare as qc INNER JOIN quotation AS q ON qc.q_id = q.compare_id left join quotation_field as qf on q.id = qf.quotation_id LEFT JOIN insurance_company AS ic ON q.company_id = ic.id where qc.q_id = $1 ORDER BY q.id ASC, qf.field_code ASC`, [q_id])

        //จัดกรุ๊ปข้อมูล
        const grouped = groupQuotationData(quotationResult.rows);
        const carData = carResult.rows[0];

        const buffer = await generateJPG({
        carData,
        insurances: grouped.insurances,
        qId: modeSender ? q_id : publicCompare //qId: publicCompare
    })

    return buffer
}