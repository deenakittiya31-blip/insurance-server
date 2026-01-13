const PDFDocument = require('pdfkit');
const axios = require('axios');
const path = require('path');

async function generatePDF(res, carData, insurances, qId) {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 0,  //ต้องตั้ง margin เป็น 0 เพื่อให้รูปเต็มหน้า
        info: {
            Title: `ใบเสนอราคา ${qId}`,
        }
    });

    // ===== ตั้ง header ก่อน pipe =====
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation_${qId}.pdf`);
    doc.pipe(res);

    try {
        // ===== 1. วางรูป Background =====
    // วิธีที่ 1: จากไฟล์ local
    const templatePath = path.join(__dirname, '../assets/bg_qt.jpg');
    doc.image(templatePath, 0, 0, {
        width: 595.28,   // A4 width in points
        height: 841.89   // A4 height in points
    });

    // วิธีที่ 2: จาก URL (ต้อง download ก่อน)
    // const templateBuffer = await downloadImage('https://your-url.com/bg_qt.jpg');
    // doc.image(templateBuffer, 0, 0, { width: 595.28, height: 841.89 });

    // ===== 2. วางข้อความทับบน Background =====
    // ต้องวัด position จากรูปเทมเพลต

    // Register Thai Font (สำคัญมาก!)
    doc.registerFont(
            'THSarabun',
            path.join(__dirname, '../fonts/THSarabunNew.ttf')
        );
        doc.registerFont(
            'THSarabun-Bold',
            path.join(__dirname, '../fonts/Sarabun-Bold.ttf')
        );

        doc.font('THSarabun').fillColor('#333333');

            // --- ข้อมูลเอกสาร ---
    doc.font('THSarabun-Bold')
       .fontSize(9)
       .fillColor('#ffffff')
       .text(`หมายเลขใบเสนอราคา : ${qId} | ประเภท : ${carData.usage}`, 50, 67);

    doc.font('THSarabun-Bold')
       .fontSize(8)
       .fillColor('#333333')
       .text(`เรียน ลูกค้า : ${carData.to_name || 'คุณลูกค้า'}`, 50, 95);

    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(`รายละเอียด : ${carData.details || '-'}`, 50, 110);

    // --- ข้อมูลรถ --- ห่างละ 15 
    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(`ยี่ห้อรถยนต์ : ${carData.car_brand}`, 50, 130);
    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(`รุ่นรถยนต์ : ${carData.car_model}`, 50, 145);
    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(`ปีรถยนต์ : ${carData.year_ad} (พ.ศ. ${carData.year_be})`, 50, 160);

     // --- Logo บริษัท ---
    const logoStartX = 250;
    const logoY = 120;
    const logoSize = 40;
    
    for (let i = 0; i < Math.min(insurances.length, 3); i++) {
        const x = logoStartX + (i * (logoSize + 90));
        if (insurances[i].company_logo) {
            try {
                const logoBuffer = await downloadImage(insurances[i].company_logo);
                doc.image(logoBuffer, x, logoY, { width: logoSize, height: logoSize });
            } catch (err) {
                // ถ้าโหลด logo ไม่ได้ ก็ข้ามไป
                console.log('Logo load failed:', err.message);
            }
        }
    }

     // --- ตารางข้อมูล ---
    await drawTableContent(doc, insurances);

    // --- Footer ---
    drawFooter(doc, carData, insurances);

    doc.end();
    } catch (err) {
        console.error('PDF generation error:', err);
        doc.end();
        throw err; 
    }
}

// Download รูปจาก URL
async function downloadImage(url) {
    const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 10000 
    });
    return Buffer.from(response.data);
}

async function drawTableContent(doc, insurances) {
    const tableX = 30;
    let tableY = 190;
    const tableWidth = 515;
    const colWidth = tableWidth / 4;  // 4 columns
    const rowHeight = 15;

    // Column widths
    const col1 = 150;  // Label column
    const colData = (tableWidth - col1) / insurances.length;  // Data columns

    // กำหนดข้อมูลแต่ละ section
    const sections = [
        {
            title: 'ข้อมูลเบี้ยประกัน:-',
            rows: [
                { label: 'บริษัทประกันภัย', key: 'insurance_company', field: 'company_name' },
                { label: 'ประเภทประกันภัย', key: 'insurance_type' },
                { label: 'ประเภทซ่อม', key: 'repair_type' },
                { label: 'ชื่อเบี้ยประกันภัย', key: 'quotation_number' },
                { label: 'รหัสเบี้ยประกัน', key: 'premium_code' },
            ]
        },
        {
            title: 'คุ้มครองรถเรา :-',
            rows: [
                { label: '  ความเสียหายต่อตัวรถยนต์', key: 'car_own_damage', format: true },
                { label: '  รถยนต์สูญหาย ไฟไหม้', key: 'car_fire_theft', format: true },
                { label: '  ความเสียหายส่วนแรก', key: 'car_own_damage_deductible', format: true },
            ]
        },
        {
            title: 'คุ้มครองคู่กรณี :-',
            rows: [
                { label: '  ความเสียหายต่อชีวิต ร่างกาย', key: 'thirdparty_injury_death_per_person', format: true },
                { label: '  ความเสียหายต่อชีวิต ร่างกาย สูงสุด', key: 'thirdparty_injury_death_per_accident', format: true },
                { label: '  ความเสียหายต่อทรัพย์สิน', key: 'thirdparty_property', format: true },
            ]
        },
        {
            title: 'คุ้มครองคนในรถ :-',
            rows: [
                { label: '  อุบัติเหตุส่วนบุคคล', key: 'additional_personal_permanent_driver_cover', format: true, seats: true },
                { label: '  รักษาพยาบาล', key: 'additional_medical_expense_cover', format: true, seats: true },
                { label: '  ประกันตัวผู้ขับขี่', key: 'additional_bail_bond', format: true },
            ]
        },
        {
            title: 'ราคาเบี้ยประกัน :-',
            rows: [
                { label: '  เบี้ยประกัน', key: 'premium_net', format: true },
                { label: '  พรบ.', key: 'compulsory_premium', format: true },
                { label: '  เบี้ยประกันรวม พรบ.', key: 'premium_total', format: true, highlight: true },
            ]
        },
    ];

    // วาดแต่ละ section
    for (const section of sections) {
        // Section Header
        doc.rect(tableX, tableY, tableWidth, rowHeight)
           .fillAndStroke('#e0f2fe', '#87ceeb');
        
        doc.fontSize(10)
           .font('THSarabun-Bold')
           .fillColor('#0284c7')
           .text(section.title, tableX + 5, tableY + 4);
        
        tableY += rowHeight;

        // Rows
        for (let i = 0; i < section.rows.length; i++) {
            const row = section.rows[i];
            const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';
            
            // Row background
            doc.rect(tableX, tableY, tableWidth, rowHeight)
               .fillAndStroke(row.highlight ? '#fef3c7' : bgColor, '#e5e7eb');

            // Label
            doc.fontSize(9)
               .font(row.highlight ? 'THSarabun-Bold' : 'THSarabun')
               .fillColor('#374151')
               .text(row.label, tableX + 5, tableY + 4, { width: col1 - 10 });

            // Values for each company
            for (let j = 0; j < insurances.length; j++) {
                const x = tableX + col1 + (j * colData);
                const ins = insurances[j];
                
                let value;
                if (row.field) {
                    value = ins[row.field] || '-';
                } else {
                    value = ins.fields[row.key] || '-';
                }

                // Format number
                if (row.format && value !== '-') {
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                        value = num.toLocaleString('th-TH');
                    }
                }

                // Add seats info
                if (row.seats && ins.fields.additional_personal_permanent_driver_number) {
                    value += ` (${ins.fields.additional_personal_permanent_driver_number})`;
                }

                doc.fillColor(row.highlight ? '#92400e' : '#374151')
                   .text(value, x, tableY + 4, { 
                       width: colData - 5, 
                       align: 'center' 
                   });
            }

            tableY += rowHeight;
        }
    }

    return tableY;
}

function drawFooter(doc, carData, insurances) {
    doc.font('THSarabun')
       .fontSize(9)
       .fillColor('#1f2937');

    // วัดตำแหน่งจาก template จริง
    doc.text(
        `ชื่อผู้เสนอราคา : ${carData.offer || '-'}`,
        45,
        740
    );

    doc.text(
        `วันที่ออกเอกสาร : ${new Date(carData.created_at_th).toLocaleString('th-TH')}`,
        45,
        755
    );
}

module.exports = { generatePDF }