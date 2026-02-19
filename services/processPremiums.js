const { createQuotation } = require("./createQuotation")
const { getPremiumDetail } = require("./getPremiumDetail")

exports.processPremiums = async(client, premiums, q_id, options = {}, member_id) => {
    const { saveToCart = false } = options

    for(let i = 0; i < premiums.length; i++) {

        //ได้ข้อมูลเป็น object premium ของตำแหน่งรอบที่วน 
        const p = premiums[i]
        const { index_company, index_package, index_premium } = p

        if (!index_company || !index_premium) {
            throw new Error(`ข้อมูล premium ที่ ${i + 1} ไม่ครบถ้วน`)
        }

        const quotation_id = await createQuotation(client, index_company, q_id, i)

        //ได้ object มาก่อนหนึ่ง
        const premiumData = await getPremiumDetail(client, index_premium)

        // บันทึกแต่ละ field แยกเป็น row
        for (const [key, value] of Object.entries(premiumData)) {
            // แปลงค่าเป็น string สำหรับบันทึก
            const fieldValue = value !== null && value !== undefined 
                ? String(value) 
                : null

            await client.query(
                `
                INSERT INTO quotation_field (quotation_id, field_code, field_value) 
                VALUES ($1, $2, $3)
                `,
                [quotation_id, key, fieldValue]
            )
        }

        if(saveToCart) {
            await client.query(
                `
                INSERT INTO premium_on_cart (compare_id, package_id, premium_id, member_id) 
                VALUES ($1, $2, $3, $4)
                `,
                [q_id, index_package, index_premium, member_id]
            )
        }
    }
}