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

    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';

    // วาดแต่ละ section
    for (const section of tableSchema) {
        // Section Header
        ctx.strokeRect(tableX, tableY, tableWidth, rowHeight);
        
        ctx.font = 'bold 28px Sarabun-Bold';
        ctx.strokeRect(tableX, tableY, tableWidth, rowHeight);
        ctx.fillText(section.title, tableX + 10, tableY + 28);
        tableY += rowHeight;

        // Rows
        for (let i = 0; i < section.rows.length; i++) {
            const row = section.rows[i];
            
            // Row background
            ctx.strokeRect(tableX, tableY, tableWidth, rowHeight);
            
   // label
            ctx.font = '26px Sarabun';
            ctx.fillText(row.label, tableX + 10, tableY + 28);

            // Values for each company
            for (let j = 0; j < insurances.length; j++) {
                const x = tableX + colLabel + (j * colData);
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

                ctx.textAlign = 'center';
                ctx.fillText(value, x + colData / 2, tableY + 28);
            }

            ctx.textAlign = 'left';
            tableY += rowHeight;
        }
    }

    return tableY;
}

module.exports = { drawTableCanvas };