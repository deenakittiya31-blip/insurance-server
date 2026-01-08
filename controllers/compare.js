const db = require('../config/database')

exports.createCompare = async(req, res) => {
    try {
        const { car_brand_id, car_model_id, car_year_id, car_usage_id } = req.body;

       // 1. insert พร้อมข้อมูลรถ และเอา id ออกมา
        const insertResult = await db.query(
            'INSERT INTO quotation_compare(car_brand_id, car_model_id, car_year_id, car_usage_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [
                Number(car_brand_id),
                Number(car_model_id),
                Number(car_year_id),
                Number(car_usage_id),
            ]
        )

        const id = insertResult.rows[0].id

        // 2. สร้าง q_id
        const q_id = `Q${String(id).padStart(3, '0')}`

        // 3. update และ return q_id
        const updateResult = await db.query(
            'UPDATE quotation_compare SET q_id = $1 WHERE id = $2 RETURNING q_id',
            [q_id, id]
        )

       res.json({
            q_id: updateResult.rows[0].q_id
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.getDetailCompare = async(req, res) => {
    try {
        const { id } = req.params

        const result = await db.query(
            'select qc.q_id, cb.name as car_brand, cm.name as car_model, cu.usage_name as usage, cy.year_be || '/' || cy.year_ad as year from quotation_compare as qc join car_brand as cb on qc.car_brand_id = cb.id join car_model as cm on qc.car_model_id = cm.id join car_usage as cu on qc.car_usage_id = cu.id join car_year as cy on qc.car_year_id = cy.id where qc.q_id = $1',[id])

        res.json({ data: result.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({ msg : 'Server error'})
    }
}
