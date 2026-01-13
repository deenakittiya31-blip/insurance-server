function groupQuotationData(rows) {
    if (!rows || rows.length === 0) {
        return { insurances: [] };
    }

    // ใช้ Map เพื่อจัดกรุ๊ปตาม quotation_id
    const groupedMap = new Map();

    rows.forEach(row => {
        const qId = row.quotation_id;

        if (!groupedMap.has(qId)) {
            // สร้างข้อมูลบริษัทใหม่
            groupedMap.set(qId, {
                quotation_id: qId,
                company_id: row.company_id,
                company_name: row.company_name,
                company_logo: row.company_logo,
                fields: {}
            });
        }

        // เพิ่ม field เข้าไป
        if (row.field_code && row.field_value !== null) {
            groupedMap.get(qId).fields[row.field_code] = row.field_value;
        }
    });

    // แปลง Map เป็น Array
    const insurances = Array.from(groupedMap.values());

    return { insurances };
}

module.exports = { groupQuotationData };