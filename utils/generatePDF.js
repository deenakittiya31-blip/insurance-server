const PDFDocument = require('pdfkit');
const axios = require('axios');
const path = require('path');
const { getTotalPremiumWithCompulsory } = require('./getTotalPremiumWithCompulsory');
const tableSchema = require('./tableSchema');

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
  
    //วางรูป Backgroundจากไฟล์ local
    const templatePath = path.join(__dirname, '../assets/bg_qt.jpg');
    doc.image(templatePath, 0, 0, {
        width: 595.28, 
        height: 841.89
    });

    // Register Thai Font
    doc.registerFont(
        'THSarabun',
        path.join(__dirname, '../fonts/Sarabun-Medium.ttf')
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
       .text(`เรียน ลูกค้า : ${carData.to_name || 'คุณลูกค้า'}`, 50, 90);

    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(`รายละเอียด : ${carData.details || '-'}`, 50, 105);

    // --- ข้อมูลรถ --- ห่างละ 15 
    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(`ยี่ห้อรถยนต์ : ${carData.car_brand}`, 50, 120);
    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(`รุ่นรถยนต์ : ${carData.car_model}`, 50, 135);
    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(`ปีรถยนต์ : ${carData.year_ad} (พ.ศ. ${carData.year_be})`, 50, 150);

     // --- Logo บริษัท ---
    const logoStartX = 250;
    const logoY = 120;
    const logoSize = 40;
    
    for (let i = 0; i < Math.min(insurances.length, 3); i++) {
        const x = logoStartX + (i * (logoSize + 85));
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

    drawPaymentSection(doc, insurances, 550);

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

function formatNumber(value) {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
        return '-';
    }
    return Number(value).toLocaleString('th-TH');
}

async function drawTableContent(doc, insurances) {
    const tableX = 30;
    let tableY = 163; //165
    const tableWidth = 515;
    const rowHeight = 15.5;

    // Column widths
    const col1 = 150;  // Label column
    const colData = (tableWidth - col1) / insurances.length;  // Data columns

    // วาดแต่ละ section
    for (const section of tableSchema) {
        // Section Header
        doc.rect(tableX, tableY, tableWidth, rowHeight)
        
        doc.fontSize(9)
           .font('THSarabun')
           .fillColor('#000000')

        doc.text(section.title, tableX + 5, tableY + 5, { width: col1 - 10 }); ////tableY + 5
        tableY += rowHeight;

        // Rows
        for (let i = 0; i < section.rows.length; i++) {
            const row = section.rows[i];
            
            // Row background
            doc.rect(tableX, tableY, tableWidth, rowHeight)

            // Label
            doc.fontSize(9)
               .font('THSarabun')
               .fillColor('#000000')
            
            doc.text(row.label, tableX + 5, tableY + 5, { width: col1 - 10 }); //tableY + 7

            // Values for each company
            for (let j = 0; j < insurances.length; j++) {
                const x = tableX + col1 + (j * colData);
                const ins = insurances[j];
                
                let value = '-';

                //กรณีเป็นแถวผลรวม
                if (row.sumKeys) {
                    const total = getTotalPremiumWithCompulsory(ins)
                     value = row.format ? formatNumber(total) : total;
                }
                //กรณี field ปกติ
                else if (row.field) {
                    value = ins[row.field] || '-';
                }
                //กรณี key ปกติ
                else if (row.key) {
                    // value = ins.fields[row.key] || '-';
                    const rawValue = ins.fields[row.key];
                    value = row.format ? formatNumber(rawValue) : (rawValue || '-');
                }

                // Add seats info
                if (row.seats && ins.fields.additional_personal_permanent_driver_number) {
                    value += ` (${ins.fields.additional_personal_permanent_driver_number} คน)`;
                }

                doc.fontSize(9)
                   .fillColor('#000000')
                
                doc.text(value, x + 40, tableY + 4, { width: colData - 10, align: 'center' });
            }

            tableY += rowHeight;
        }
    }

    return tableY;
}

function drawPaymentSection(doc, insurances, startY = 600) {
    const startX = 220;
    const gapX = 120; // ระยะห่างระหว่างกล่อง

    for (let i = 0; i < insurances.length; i++) {
        const ins = insurances[i];
        const x = startX + (i * gapX);

        const total = getTotalPremiumWithCompulsory(ins);
        const totalText = total.toLocaleString('th-TH');

        doc.font('THSarabun-Bold')
           .fontSize(9)
           .fillColor('#333')
           .text('วิธีชำระเงิน :', x + 8, startY + 8);

        doc.font('THSarabun-Bold')
           .fontSize(9)
           .text('ชำระเงินสด ราคาพิเศษ :', x + 8, startY + 25);
        
        
        doc.font('THSarabun-Bold')
           .fontSize(9)
           .fillColor('#000')
           .text(`${totalText} บาท`, x + 8, startY + 45);

    }
}

function drawFooter(doc, carData, insurances) {
    // วัดตำแหน่งจาก template จริง
    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(
        `ชื่อผู้เสนอราคา : ${carData.offer || '-'}`,
        50,
        725
    );

    doc.font('THSarabun-Bold')
       .fillColor('#333333')
       .fontSize(8)
       .text(
        `วันที่ออกเอกสาร : ${new Date(carData.created_at_th).toLocaleString('th-TH')}`,
        50,
        745
    );

    doc.font('THSarabun-Bold')
       .fillColor('#ffffff')
       .fontSize(9)
       .text('DEENA BROCKER (ดีน่า โบรคเกอร์)', 50, 770)
    doc.font('THSarabun')
       .fillColor('#ffffff')
       .fontSize(8)
       .text('44/170 ปริญลักษณ์ เพชรเกษม 69 ถนนเลียบฯ ฝั่งเหนือ',50, 785)
    doc.font('THSarabun')
       .fillColor('#ffffff')
       .fontSize(8)
       .text('แขวงหนองแขม เขตหนองแขม กรุงเทพมหานคร 10160', 50, 795)

     doc.font('THSarabun-Bold')
       .fillColor('#ffffff')
       .fontSize(10)
       .text('095-065-8887',50, 815);

     doc.font('THSarabun-Bold')
       .fillColor('#ffffff')
       .fontSize(10)
       .text('@deena',225, 815);
}

module.exports = { generatePDF }