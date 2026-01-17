const db = require('../config/database');
const { dataQuotation, additional } = require('../utils/dataQuotation');

exports.createFieldsModel = async(req, res) => {
    try {
        const {company_id, key_name, description, example_value} = req.body;

        await db.query('insert into company_theme (company_id, key_name, description, example_value) values ($1, $2, $3, $4)', 
            [
                Number(company_id),
                key_name, 
                description, 
                example_value
            ])

        res.json({msg: 'เพิ่มฟิลด์ดึงข้อมูลสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.createModel = async(req, res) => {
    const { company_id } = req.body;

    if (!company_id) {
        return res.status(400).json({ msg: 'company_id is required' });
    }

    try {

        for (const field of dataQuotation) {
            const { key_name, description, example_value } = field;

            await db.query(
                `insert into company_theme 
                 (company_id, key_name, description, example_value) 
                 values ($1, $2, $3, $4)`,
                [
                    Number(company_id),
                    key_name,
                    description,
                    example_value
                ]
            );
        } 
        
        await db.query(`insert into additional_theme (company_id, additional) values ($1, $2)`, [company_id, additional])

        res.json({ 
            success: true,
            msg: 'สร้างโมเดลสำเร็จ'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.listModel = async(req, res) => {
    try {
        const page = Number(req.query.page) || 1
        const per_page = Number(req.query.per_page) || 5
        const offset = (page - 1) * per_page

        const result = await db.query(`select distinct ct.company_id, ic.namecompany from company_theme as ct join insurance_company as ic on ct.company_id = ic.id ORDER BY ct.company_id LIMIT $1 OFFSET $2`, [per_page, offset])
        
        const countResult = await db.query(`select count(distinct ct.company_id) as total_company from company_theme ct join insurance_company ic on ct.company_id = ic.id;`)

        res.json({ data: result.rows, total: countResult.rows[0].total_company })
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.readModel = async(req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`select id, key_name, description, example_value from company_theme where company_id = $1 order by id`, [id])

        const additional = await db.query(`select id, additional from additional_theme where company_id = $1`, [id])
        
        
        res.json({data: result.rows, additional: additional.rows[0]})
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.removeModel = async(req, res) => {
    try {
        const {id} = req.params;

        await db.query('DELETE FROM company_theme WHERE company_id = $1', [id])

        res.json({msg: 'ลบโมเดลบริษัทสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.removeFieldModel = async(req, res) => {
    try {
        const {id} = req.params;

        await db.query('DELETE FROM company_theme WHERE id = $1', [id])

        res.json({msg: 'ลบฟิลด์ดึงข้อมูลสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.readFieldsModel = async(req, res) => {
    const {id} = req.params;

    try{
        const result = await db.query('select id, key_name, description, example_value from company_theme where id = $1',[id])

        res.json({detail: result.rows[0]})  
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.updateModelFields = async(req, res) => {
    const {id} = req.params;
    const {key_name, description, example_value} = req.body;

    try {
        await db.query('update company_theme set key_name = coalesce($1, key_name), description = coalesce($2, description), example_value = coalesce($3, example_value) where id = $4',
            [
                key_name        ?? null,
                description     ?? null,
                example_value   ?? null,
                id
            ]
        )
        res.json({msg: 'แก้ไขฟิลด์ข้อมูลสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.updateAdditional = async(req, res) => {
    const {id} = req.params;
    const {additional} = req.body;

    try {
        await db.query('update additional_theme set additional = coalesce($1, additional) where id = $2',
            [
                additional ?? null,
                id
            ]
        )
        res.json({msg: 'แก้ไขข้อมูลคำแนะนำเพิ่มเติมสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

