const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const path = require('path');
const { drawTableCanvas } = require('./drawTableCanvas');

async function loadRemoteImage(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return loadImage(Buffer.from(res.data));
}

async function generateJPG({ carData, insurances, qId }) {
    const canvas = createCanvas(2480, 3508);
    const ctx = canvas.getContext('2d');

    const bg = await loadImage(path.join(__dirname, '../assets/bg_qt.jpg'));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // ===== Header =====
    ctx.fillStyle = '#000';
    ctx.font = 'bold 42px Sarabun';
    ctx.fillText(`ใบเสนอราคา ${qId}`, 120, 120);

    ctx.font = '32px Sarabun';
    ctx.fillText(`เรียน : ${carData.to_name || 'คุณลูกค้า'}`, 120, 180);
    ctx.fillText(`ยี่ห้อ : ${carData.car_brand}`, 120, 240);
    ctx.fillText(`รุ่น : ${carData.car_model}`, 120, 300);
    ctx.fillText(`ปี : ${carData.year_ad}`, 120, 360);

    // ===== Logos =====
    let x = 1500;
    for (let i = 0; i < Math.min(insurances.length, 3); i++) {
        if (insurances[i].company_logo) {
            try {
                const img = await loadImage(insurances[i].company_logo);
                ctx.drawImage(img, x, 200, 160, 160);
                x += 220;
            } catch (err) {
                console.log('Logo load fail', err.message);
            }
        }
    }

    drawTableCanvas(ctx, insurances)

    return canvas.toBuffer('image/jpeg', { quality: 0.95 });
}

module.exports = { generateJPG };
