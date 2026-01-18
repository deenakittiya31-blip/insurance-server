const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');
const { drawTableCanvas } = require('./drawTableCanvas');
const { getTotalPremiumWithCompulsory } = require('./getTotalPremiumWithCompulsory');

registerFont(
    path.join(__dirname, '../fonts/Sarabun-Medium.ttf'),
    { family: 'Sarabun' }
);

registerFont(
        path.join(__dirname, '../fonts/Sarabun-Bold.ttf'),
    { family: 'Sarabun-Bold' }
);

async function loadRemoteImage(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return loadImage(Buffer.from(res.data));
}

async function generateJPG({ carData, insurances, qId }) {
    const canvas = createCanvas(2480, 3508);
    const ctx = canvas.getContext('2d');

    const bg = await loadImage(path.join(__dirname, '../assets/bg_qt.jpg'));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#fff';
    ctx.font = '34px Sarabun-Bold';
    ctx.fillText(`หมายเลขใบเสนอราคา : ${qId} | ประเภท : ${carData.usage}`, 120, 315);

    ctx.fillStyle = '#000';
    ctx.font = '32px Sarabun-Bold';
    ctx.fillText(`เรียน : ${carData.to_name || 'คุณลูกค้า'}`, 120, 410);// space 30
    ctx.fillText(`รายละเอียด : ${carData.details || '-'}`, 120, 470);
    ctx.fillText(`ยี่ห้อรถยนต์ : ${carData.car_brand}`, 120, 540);
    ctx.fillText(`รุ่นรถยนต์ : ${carData.car_model}`, 120, 600);
    ctx.fillText(`ปีรถยนต์ : ${carData.year_ad} (พ.ศ. ${carData.year_be})`, 120, 660);

    // Logos
    const logoStartX = 1080;
    const logoY = 540;
    const logoSize = 150;
    for (let i = 0; i < Math.min(insurances.length, 3); i++) {
        const x = logoStartX + (i * (logoSize + 400));
        if (insurances[i].company_logo) {
            try {
                const img = await loadRemoteImage(insurances[i].company_logo);
                ctx.drawImage(img, x, logoY, logoSize, logoSize);
            } catch (err) {
                console.log('Logo load fail', err.message);
            }
        }
    }

    drawTableCanvas(ctx, insurances)

    drawPaymentSection(ctx, insurances, 2300);

    // --- Footer ---
    drawFooter(ctx, carData, insurances);

    return canvas.toBuffer('image/jpeg', { quality: 0.95 });
}

function drawPaymentSection(ctx, insurances, startY = 2600) {
    const startX = 950;
    const gapX = 500;

    ctx.textBaseline = 'top';

    for (let i = 0; i < insurances.length; i++) {
        const ins = insurances[i];
        const x = startX + (i * gapX);

        const total = getTotalPremiumWithCompulsory(ins);
        const totalText = total.toLocaleString('th-TH');

        ctx.font = '32px Sarabun';
        ctx.fillText('วิธีชำระเงิน :', x, startY);

        ctx.font = '32px Sarabun';
        ctx.fillText('ชำระเงินสด ราคาพิเศษ :', x, startY + 45);

        ctx.font = '32px Sarabun';
        ctx.fillText(`${totalText} บาท`, x, startY + 95);
    }
}

function drawFooter(ctx, carData) {
    ctx.textBaseline = 'top';

    // ข้อมูลผู้เสนอราคา
    ctx.fillStyle = '#333';
    ctx.font = '28px Sarabun-Bold';
    ctx.fillText(
        `ชื่อผู้เสนอราคา : ${carData.offer || '-'}`,
        120,
        3050
    );

    ctx.fillText(
        `วันที่ออกเอกสาร : ${new Date(carData.created_at_th).toLocaleString('th-TH')}`,
        120,
        3110
    );

    // บริษัท
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Sarabun-Bold';
    ctx.fillText('DEENA BROCKER (ดีน่า โบรคเกอร์)', 120, 3195);

    ctx.font = '26px Sarabun';
    ctx.fillText(
        '44/170 ปริญลักษณ์ เพชรเกษม 69 ถนนเลียบฯ ฝั่งเหนือ',
        120,
        3240
    );
    ctx.fillText(
        'แขวงหนองแขม เขตหนองแขม กรุงเทพมหานคร 10160',
        120,
        3275
    );

    // Contact
    ctx.font = 'bold 30px Sarabun-Bold';
    ctx.fillText('095-065-8887', 200, 3400);
    ctx.fillText('@deena', 950, 3400);
}


module.exports = { generateJPG };
