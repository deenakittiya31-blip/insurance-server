const db = require('../config/database')
const PDFDocument = require('pdfkit');

exports.createCompare = async(req, res) => {
    try {
        const { car_brand_id, car_model_id, car_year_id, car_usage_id } = req.body;

       // 1. insert พร้อมข้อมูลรถ และเอา id ออกมา
        const insertResult = await db.query(
            'INSERT INTO quotation_compare(car_brand_id, car_model_id, car_year_id, car_usage_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [
                Number(car_brand_id),
                Number(car_model_id),
                Number(car_year_id),
                Number(car_usage_id),
            ]
        )

        const id = insertResult.rows[0].id

        // 2. สร้าง q_id
        const q_id = `Q${String(id).padStart(3, '0')}`

        // 3. update และ return q_id
        const updateResult = await db.query(
            'UPDATE quotation_compare SET q_id = $1 WHERE id = $2 RETURNING q_id',
            [q_id, id]
        )

       res.json({
            q_id: updateResult.rows[0].q_id
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

        // 🟢 group fields
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

    // ตั้งค่า response header
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comparison_${id}.pdf`);

    // Pipe PDF ไปที่ response
    doc.pipe(res);

    // ลงทะเบียนฟอนต์ภาษาไทย (สำคัญมาก!)
    doc.registerFont('THSarabunNew', 'fonts/thsarabunnew-webfont.ttf');
    doc.registerFont('THSarabunNew-Bold', 'fonts/thsarabunnew_bold-webfont.ttf');

    // === Header ===
    doc.font('THSarabunNew-Bold')
       .fontSize(24)
       .fillColor('#0066cc')
       .text('เอกสารเปรียบเทียบใบเสนอราคาประกันภัย', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.font('THSarabunNew')
       .fontSize(14)
       .fillColor('#333333')
       .text(`เลขที่: ${carData.q_id}`, { align: 'center' });

    doc.moveDown(1);

    // === กรอบข้อมูลรถ ===
    const boxTop = doc.y;
    doc.rect(50, boxTop, 495, 100)
       .fillAndStroke('#f8f9fa', '#0066cc');

    doc.fillColor('#333333')
       .font('THSarabunNew-Bold')
       .fontSize(16)
       .text('ข้อมูลรถยนต์', 60, boxTop + 15);

    doc.font('THSarabunNew')
       .fontSize(14)
       .text(`ยี่ห้อ: ${carData.car_brand}`, 60, boxTop + 40)
       .text(`รุ่น: ${carData.car_model}`, 60, boxTop + 60)
       .text(`ประเภทการใช้งาน: ${carData.usage}`, 300, boxTop + 40)
       .text(`ปี: ${carData.year_be} / ${carData.year_ad}`, 300, boxTop + 60);

    doc.moveDown(3);

    // === ตารางเปรียบเทียบ ===
    doc.font('THSarabunNew-Bold')
       .fontSize(16)
       .text('ตารางเปรียบเทียบ', 50, doc.y);

    doc.moveDown(0.5);

    // วาดตาราง
    drawComparisonTable(doc, companies, quotations);

    // === Footer ===
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        doc.font('THSarabunNew')
           .fontSize(10)
           .fillColor('#666666')
           .text(
               `สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH', { 
                   year: 'numeric', 
                   month: 'long', 
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
               })}`,
               50,
               doc.page.height - 50,
               { align: 'center' }
           );
    }

    doc.end();
}

// ฟังก์ชันวาดตาราง
function drawComparisonTable(doc, companies, quotations) {
    const startX = 50;
    let startY = doc.y;
    const colWidth = 495 / (companies.length + 1); // +1 สำหรับคอลัมน์รายการ
    const rowHeight = 35;

    // Labels สำหรับแต่ละ field
    const fieldLabels = {
        'quotation_number': 'เลขที่ใบเสนอราคา',
        'quotation_date': 'วันที่ใบเสนอราคา',
        'insurance_company': 'บริษัทประกันภัย',
        'repair_type': 'ประเภทการซ่อม',
        'car_brand': 'ยี่ห้อรถ',
        'additional_personal_permanent_driver_number': 'จำนวนคนขับเพิ่ม',
        'car_own_damage': 'ทุนประกัน'
    };

    // ดึง field_code ทั้งหมด
    const allFieldCodes = new Set();
    Object.values(quotations).forEach(fields => {
        Object.keys(fields).forEach(code => allFieldCodes.add(code));
    });
    const fieldCodesArray = Array.from(allFieldCodes);

    // === Header Row (บริษัท) ===
    doc.font('THSarabunNew-Bold').fontSize(12);
    
    // คอลัมน์รายการ
    doc.rect(startX, startY, colWidth, rowHeight)
       .fillAndStroke('#0066cc', '#000000');
    doc.fillColor('#ffffff')
       .text('รายการ', startX + 5, startY + 10, { width: colWidth - 10, align: 'center' });

    // คอลัมน์บริษัท
    companies.forEach((company, index) => {
        const x = startX + colWidth * (index + 1);
        doc.rect(x, startY, colWidth, rowHeight)
           .fillAndStroke('#0066cc', '#000000');
        
        doc.fillColor('#ffffff')
           .fontSize(11)
           .text(company.company, x + 5, startY + 10, { 
               width: colWidth - 10, 
               align: 'center' 
           });
    });

    startY += rowHeight;

    // === Data Rows ===
    doc.font('THSarabunNew').fontSize(11);
    
    fieldCodesArray.forEach((fieldCode, rowIndex) => {
        const isEvenRow = rowIndex % 2 === 0;
        const label = fieldLabels[fieldCode] || fieldCode;

        // คอลัมน์รายการ
        doc.rect(startX, startY, colWidth, rowHeight)
           .fillAndStroke(isEvenRow ? '#f8f9fa' : '#ffffff', '#cccccc');
        
        doc.fillColor('#333333')
           .font('THSarabunNew-Bold')
           .text(label, startX + 5, startY + 10, { 
               width: colWidth - 10, 
               align: 'left' 
           });

        // คอลัมน์ข้อมูล
        companies.forEach((company, colIndex) => {
            const x = startX + colWidth * (colIndex + 1);
            const quotationId = Object.keys(quotations)[colIndex];
            const value = quotations[quotationId]?.[fieldCode] || '-';

            doc.rect(x, startY, colWidth, rowHeight)
               .fillAndStroke(isEvenRow ? '#f8f9fa' : '#ffffff', '#cccccc');
            
            doc.fillColor('#333333')
               .font('THSarabunNew')
               .text(value, x + 5, startY + 10, { 
                   width: colWidth - 10, 
                   align: 'center' 
               });
        });

        startY += rowHeight;

        // ถ้าใกล้จบหน้า ให้ขึ้นหน้าใหม่
        if (startY > doc.page.height - 100) {
            doc.addPage();
            startY = 50;
        }
    });
}


