const db = require('../config/database')
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

exports.createCompare = async(req, res) => {
    try {
        const { to_name, details, car_brand_id, car_model_id, car_year_id, car_usage_id, offer } = req.body;

        //สร้างเลข q_id
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')

        const yearMonth = `${year}${month}` // 202601

        const countResult = await db.query(
            `SELECT COUNT(*) FROM quotation WHERE q_id LIKE $1`,
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

        const result = await db.query('select qc.q_id, cb.name as car_brand, cm.name as car_model, cu.usage_name as usage, cy.year_be, cy.year_ad from quotation_compare as qc join car_brand as cb on qc.car_brand_id = cb.id join car_model as cm on qc.car_model_id = cm.id join car_usage as cu on qc.car_usage_id = cu.id join car_year as cy on qc.car_year_id = cy.id where qc.q_id::text = $1',[id])

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
        const carResult = await db.query('select qc.q_id, cb.name as car_brand, cm.name as car_model, cu.usage_name as usage, cy.year_be, cy.year_ad from quotation_compare as qc join car_brand as cb on qc.car_brand_id = cb.id join car_model as cm on qc.car_model_id = cm.id join car_usage as cu on qc.car_usage_id = cu.id join car_year as cy on qc.car_year_id = cy.id where qc.q_id = $1', [id])

        if (!carResult.rows.length) {
            return res.status(404).json({ msg: 'ไม่พบข้อมูลรถ' });
        }

        const companyResult = await db.query('select ic.namecompany as company, ic.logo_url from quotation_compare as qc left join quotation as q on qc.q_id = q.q_id left join insurance_company as ic on q.company_id = ic.id where qc.q_id = $1 order by q.id asc', [id])

        //รอบสอง query ข้อมูลเอกสาร
        const quotationResult = await db.query('select qf.quotation_id, qf.field_code, qf.field_value from quotation_compare as qc left join quotation as q on qc.q_id = q.q_id left join quotation_field as qf on q.id = qf.quotation_id where qc.q_id = $1 order by quotation_id asc', [id])

        //group fields
        const quotations = {};
        quotationResult.rows.forEach(row => {
            if (!row.quotation_id) return;

            if (!quotations[row.quotation_id]) {
                quotations[row.quotation_id] = {};
            }

            quotations[row.quotation_id][row.field_code] = row.field_value;
        });

        const carData = carResult.rows[0];
        const companies = companyResult.rows;

        // สร้าง PDF
        await generatePDF(res, carData, companies, quotations, id);


    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: 'Server error'})
    }
}

// ฟังก์ชันสร้าง PDF
async function generatePDF(res, carData, companies, quotations, id) {
    const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        bufferPages: true
    });

     //กำหนด path ของฟอนต์
    const fontRegular = path.join(__dirname, '..', 'fonts', 'Sarabun-Regular.ttf');
    const fontBold = path.join(__dirname, '..', 'fonts', 'Sarabun-Bold.ttf');


    // ตั้งค่า response header
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comparison_${id}.pdf`);

    // Pipe PDF ไปที่ response
    doc.pipe(res);

    //ตรวจสอบและลงทะเบียนฟอนต์ไทย
        try {
            if (fs.existsSync(fontRegular) && fs.existsSync(fontBold)) {
                doc.registerFont('Sarabun', fontRegular);
                doc.registerFont('Sarabun-Bold', fontBold);
            }
        } catch (fontError) {
            console.error('Error loading fonts:', fontError);
        }

    // === ส่วนหัว ===
        doc.font('Sarabun')
           .fontSize(12)
           .fillColor('#000000');

        doc.text(`หมายเลขใบเสนอราคา : ${carData.q_id}`, 40, 40);
        doc.text(`ยี่ห้อรถยนต์ : ${carData.car_brand}`, 40, 60);
        doc.text(`รุ่นรถยนต์: ${carData.car_model}`, 40, 80);
        doc.text(`ปีรถยนต์ : ${carData.year_be} / ${carData.year_ad}`, 40, 100);

        // === ตาราง ===
        let startY = 130;
        drawComparisonTableNew(doc, companies, quotations, startY);

        doc.end();
        
        doc.on('finish', () => {
            resolve();
        });
}

// ฟังก์ชันวาดตารางแบบใหม่
function drawComparisonTableNew(doc, companies, quotations, startY) {
    const pageWidth = 595.28; // A4 width
    const margin = 40;
    const tableWidth = pageWidth - (margin * 2);
    
    // คำนวณความกว้างคอลัมน์
    const labelColWidth = 180;
    const dataColWidth = (tableWidth - labelColWidth) / companies.length;
    
    let currentY = startY;
    const rowHeight = 25;
    const headerHeight = 30;

    // ข้อมูลที่จะแสดง (เรียงตามลำดับ)
    const fields = [
        { code: 'insurance_company', label: 'บริษัทประกันภัย', isHeader: true },
        { code: 'insurance_type', label: 'ประเภทประกัน' },
        { code: 'repair_type', label: 'ประเภทซ่อม' },
        { label: 'คุ้มครองรถเรา', isSection: true },
        { code: 'car_own_damage', label: 'ความเสียหายต่อตัวรถยนต์' },
        { code: 'car_fire_theft', label: 'รถยนต์สูญหาย ไฟไหม้' },
        { code: 'car_own_damage_deductible', label: 'ความเสียหายส่วนแรก' },
        { label: 'คุ้มครองคู่กรณี', isSection: true },
        { code: 'thirdparty_injury_death_per_accident', label: 'ความรับผิดต่อชีวิตร่างกายบุคคลภายนอก (ต่อครั้ง)' },
        { code: 'thirdparty_injury_death_per_person', label: 'ความรับผิดต่อชีวิตร่างกายบุคคลภายนอก (ต่อคน)' },
        { code: 'thirdparty_property', label: 'ความรับผิดต่อทรัพย์สินของบุคคลภายนอก' },
        { label: 'เอกสารแนบท้าย', isSection: true },
        { code: 'additional_personal_permanent_driver_cover', label: 'อุบัติเหตุส่วนบุคคล' },
        { code: 'additional_medical_expense_cover', label: 'ค่ารักษาพยาบาล' },
        { code: 'additional_bail_bond', label: 'การประกันตัวผู้ขับขี่' }
    ];

    // วาดแต่ละแถว
    fields.forEach((field, index) => {
        // ตรวจสอบว่าต้องขึ้นหน้าใหม่หรือไม่
        if (currentY > 750) {
            doc.addPage();
            currentY = 40;
        }

        if (field.isHeader) {
            // แถวหัวตาราง (บริษัทประกันภัย)
            doc.font('Sarabun-Bold').fontSize(11);

            // คอลัมน์แรก (ว่าง)
            doc.rect(margin, currentY, labelColWidth, headerHeight)
               .fillAndStroke('#e0e0e0', '#000000');

            // คอลัมน์บริษัท
            companies.forEach((company, idx) => {
                const x = margin + labelColWidth + (dataColWidth * idx);
                doc.rect(x, currentY, dataColWidth, headerHeight)
                   .fillAndStroke('#e0e0e0', '#000000');
                
                doc.fillColor('#000000')
                   .text(
                       company.company, 
                       x + 5, 
                       currentY + 8, 
                       { width: dataColWidth - 10, align: 'center' }
                   );
            });

            currentY += headerHeight;

        } else if (field.isSection) {
            // หัวข้อหมวดหมู่ (เต็มแถว)
            doc.font('Sarabun-Bold').fontSize(11);
            doc.rect(margin, currentY, tableWidth, rowHeight)
               .fillAndStroke('#f5f5f5', '#000000');
            
            doc.fillColor('#000000')
               .text(field.label, margin + 5, currentY + 7, { width: tableWidth - 10 });

            currentY += rowHeight;

        } else {
            // แถวข้อมูลทั่วไป
            doc.font('Sarabun').fontSize(10);

            // คอลัมน์ชื่อรายการ
            doc.rect(margin, currentY, labelColWidth, rowHeight)
               .stroke('#000000');
            doc.fillColor('#000000')
               .text(field.label, margin + 5, currentY + 7, { width: labelColWidth - 10 });

            // คอลัมน์ข้อมูล
            companies.forEach((company, idx) => {
                const x = margin + labelColWidth + (dataColWidth * idx);
                const quotationId = Object.keys(quotations)[idx];
                const value = quotations[quotationId]?.[field.code] || '-';

                doc.rect(x, currentY, dataColWidth, rowHeight)
                   .stroke('#000000');
                
                doc.fillColor('#000000')
                   .text(
                       value, 
                       x + 5, 
                       currentY + 7, 
                       { width: dataColWidth - 10, align: 'center' }
                   );
            });

            currentY += rowHeight;
        }
    });
}