const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');
const { drawTableCanvas } = require('./drawTableCanvas');

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
    const logoStartX = 250;
    const logoY = 600;
    const logoSize = 40;
    for (let i = 0; i < Math.min(insurances.length, 3); i++) {
        const x = logoStartX + (i * (logoSize + 50));
        if (insurances[i].company_logo) {
            try {
                const img = await loadRemoteImage(insurances[i].company_logo);
                ctx.drawImage(img, x, logoY, { width: logoSize, height: logoSize });
            } catch (err) {
                console.log('Logo load fail', err.message);
            }
        }
    }

    drawTableCanvas(ctx, insurances)

    return canvas.toBuffer('image/jpeg', { quality: 0.95 });
}

module.exports = { generateJPG };
