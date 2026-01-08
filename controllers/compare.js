const db = require('../config/database')
const puppeteer = require('puppeteer')

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

              //สร้าง HTML Template
        const htmlContent = generateHTMLTemplate(carData, companies, quotations);

         // 🔥 สร้าง PDF ด้วย Puppeteer
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();

        // ส่ง PDF กลับไปให้ user
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=comparison_${id}.pdf`);
        res.send(pdfBuffer);

    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: 'Server error'})
    }
}

// 🎨 ฟังก์ชันสร้าง HTML Template
function generateHTMLTemplate(carData, companies, quotations) {
    // สร้าง header ของตาราง (คอลัมน์บริษัท)
    const companyHeaders = companies.map(comp => `
        <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            ${comp.logo_url ? `<img src="${comp.logo_url}" alt="${comp.company}" style="max-width: 80px; max-height: 40px;">` : ''}
            <div style="margin-top: 5px;">${comp.company}</div>
        </th>
    `).join('');

    // สร้าง rows ของตารางเปรียบเทียบ
    const fieldLabels = {
        'quotation_number': 'เลขที่ใบเสนอราคา',
        'quotation_date': 'วันที่ใบเสนอราคา',
        'insurance_company': 'บริษัทประกันภัย',
        'repair_type': 'ประเภทการซ่อม',
        'car_brand': 'ยี่ห้อรถ',
        'additional_personal_permanent_driver_number': 'จำนวนคนขับเพิ่มเติม',
        'car_own_damage': 'ทุนประกัน'
    };

    // ดึง field_code ทั้งหมดที่ไม่ซ้ำกัน
    const allFieldCodes = new Set();
    Object.values(quotations).forEach(fields => {
        Object.keys(fields).forEach(code => allFieldCodes.add(code));
    });

    const comparisonRows = Array.from(allFieldCodes).map(fieldCode => {
        const label = fieldLabels[fieldCode] || fieldCode;
        const values = companies.map((comp, index) => {
            const quotationId = Object.keys(quotations)[index];
            const value = quotations[quotationId]?.[fieldCode] || '-';
            return `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${value}</td>`;
        }).join('');

        return `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: 600; background-color: #f8f9fa;">${label}</td>
                ${values}
            </tr>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>เปรียบเทียบใบเสนอราคาประกันภัย</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Sarabun', 'Arial', sans-serif; 
                    padding: 20px;
                    font-size: 14px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #007bff;
                }
                .header h1 {
                    color: #007bff;
                    margin-bottom: 10px;
                }
                .car-info {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #007bff;
                }
                .car-info h3 {
                    color: #333;
                    margin-bottom: 10px;
                }
                .car-details {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }
                .car-details div {
                    padding: 8px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background-color: #007bff;
                    color: white;
                    font-weight: 600;
                }
                tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>เอกสารเปรียบเทียบใบเสนอราคาประกันภัย</h1>
                <p>เลขที่: ${carData.q_id}</p>
            </div>

            <div class="car-info">
                <h3>ข้อมูลรถยนต์</h3>
                <div class="car-details">
                    <div><strong>ยี่ห้อ:</strong> ${carData.car_brand}</div>
                    <div><strong>รุ่น:</strong> ${carData.car_model}</div>
                    <div><strong>ประเภทการใช้งาน:</strong> ${carData.usage}</div>
                    <div><strong>ปี พ.ศ.:</strong> ${carData.year_be}</div>
                    <div><strong>ปี ค.ศ.:</strong> ${carData.year_ad}</div>
                </div>
            </div>

            <h3 style="margin-bottom: 15px; color: #333;">ตารางเปรียบเทียบ</h3>
            <table>
                <thead>
                    <tr>
                        <th style="padding: 12px; border: 1px solid #ddd;">รายการ</th>
                        ${companyHeaders}
                    </tr>
                </thead>
                <tbody>
                    ${comparisonRows}
                </tbody>
            </table>

            <div class="footer">
                <p>สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
        </body>
        </html>
    `;
}
