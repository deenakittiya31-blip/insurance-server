const pdf = require('pdf-poppler')

async function pdfToJpg(pdfPath, outputDir) {
    const options = {
    format: "jpeg",
    out_dir: outputDir,
    out_prefix: "page",
    page: null, // ทุกหน้า
    dpi: 300
  };

  await pdf.convert(pdfPath, options);

  return outputDir;
}

module.exports = { pdfToJpg }