const { getTotalPremiumWithCompulsory } = require("./getTotalPremiumWithCompulsory");
const tableSchema = require("./tableSchema");


function formatNumber(value) {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
        return '-';
    }
    return Number(value).toLocaleString('th-TH');
}

function drawTableCanvas(ctx, insurances) {
    const tableX = 120;
    let tableY = 520;
    const tableWidth = 2200;
    const rowHeight = 40;

    const colLabel = 500;
    const colData = (tableWidth - colLabel) / insurances.length;

    // วาดแต่ละ section
    for (const section of tableSchema) {
        // Section Header
        ctx.rect(tableX, tableY, tableWidth, rowHeight)
        
        ctx.fontSize(9)
           .font('THSarabun-Bold')
           .fillColor('#000000')

        ctx.text(section.title, tableX + 5, tableY + 5, { width: col1 - 10 }); ////tableY + 5
        tableY += rowHeight;

        // Rows
        for (let i = 0; i < section.rows.length; i++) {
            const row = section.rows[i];
            
            // Row background
            ctx.rect(tableX, tableY, tableWidth, rowHeight)

            // Label
            ctx.fontSize(9)
               .font('THSarabun')
               .fillColor('#000000')
            
            ctx.text(row.label, tableX + 5, tableY + 7, { width: col1 - 10 }); //tableY + 7

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

                ctx.fontSize(9)
                   .fillColor('#000000')
                
                ctx.text(value, x + 40, tableY + 7, { width: colData - 10, align: 'center' });
            }

            tableY += rowHeight;
        }
    }

    return tableY;
}

module.exports = { drawTableCanvas };