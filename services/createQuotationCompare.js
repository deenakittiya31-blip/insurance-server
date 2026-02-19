exports.createQuotationCompare = async(client, data) => {
    //1. สร้างใบเสอนราคาที่ quotation compare
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const yearMonth = `${year}${month}`

       //2. insert พร้อมข้อมูลรถ และเอา id ออกมา
        const insertResult = await client.query(
            `INSERT INTO quotation_compare(
                to_name, details, car_brand_id, car_model_id, car_year_id, car_usage_id, offer_id, sub_car_model, import_by
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id`,
            [
                data.to_name || null,
                data.details || null,
                data.car_brand_id ? Number(data.car_brand_id) : null,
                data.car_model_id ? Number(data.car_model_id) : null,
                data.car_year_id ? Number(data.car_year_id) : null,
                data.car_usage_id ? Number(data.car_usage_id) : null,
                Number(data.offer_id),
                data.sub_car_model || null,
                data.import_by
            ]
        )

        const compareId  = insertResult.rows[0].id
        const runningNumber = String(compareId ).padStart(6, '0')
        const q_id = `Q${yearMonth}${runningNumber}`

        //3. update q_id
        await client.query(
            `UPDATE quotation_compare SET q_id = $1 WHERE id = $2`,
            [q_id, compareId ]
        )

        return  q_id 
}