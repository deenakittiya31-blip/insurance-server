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

    for (const section of tableSchema) {
        // ===== Section Header =====
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(tableX, tableY, tableWidth, rowHeight);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 28px Sarabun';
        ctx.fillText(section.title, tableX + 10, tableY + 30);

        tableY += rowHeight;

        for (const row of section.rows) {
            // row border
            ctx.strokeStyle = '#000';
            ctx.strokeRect(tableX, tableY, tableWidth, rowHeight);

            // label
            ctx.font = '26px Sarabun';
            ctx.fillStyle = '#000';
            ctx.fillText(row.label, tableX + 10, tableY + 28);

            // values
            insurances.forEach((ins, idx) => {
                let value = '-';

                if (row.sumKeys) {
                    value = formatNumber(getTotalPremiumWithCompulsory(ins));
                } else if (row.field) {
                    value = ins[row.field] || '-';
                } else if (row.key) {
                    const raw = ins.fields?.[row.key];
                    value = row.format ? formatNumber(raw) : (raw || '-');
                }

                const x = tableX + colLabel + idx * colData;
                ctx.fillText(
                    value,
                    x + colData / 2 - 50,
                    tableY + 28
                );
            });

            tableY += rowHeight;
        }
    }
}

module.exports = { drawTableCanvas };
