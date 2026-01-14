const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');

async function pdfToJpg(pdfPath, outputDir) {
    //1.สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const opts = {
        format: 'jpeg',
        out_dir: outputDir,
        out_prefix: 'page',
        dpi: 300,
        page: 1  
    };

    //2.แปลง PDF → JPG
    await pdf.convert(pdfPath, opts);

    // pdf-poppler จะตั้งชื่อแบบ page-1.jpg
    const imagePath = path.join(outputDir, 'page-1.jpg');

    return path.join(outputDir, 'page-1.jpg');
}

module.exports = { pdfToJpg };
