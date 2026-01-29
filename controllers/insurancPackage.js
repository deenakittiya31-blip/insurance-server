const db = require('../config/database')

exports.create = async(req, res) => {
    try {
        const { company_id, insur_type_id, car_brand_id, car_model_id, usage_car_id, car_year_id, package_name  } = req.body

        await db.query('INSERT INTO insurance_package(company_id, insur_type_id, car_brand_id, car_model_id, usage_car_id, car_year_id, package_name) VALUES($1, $2, $3, $4, $5, $6, $7)', 
            [
                Number(company_id), 
                Number(insur_type_id),
                car_brand_id,
                Number(car_model_id),
                Number(usage_car_id),
                Number(car_year_id),
                package_name
            ])

        res.json({ msg: 'เพิ่มข้อมูลแพ็คเกจสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.per_page) || 5;

    const offset = (page - 1) * per_page

    try {
        const query = 'SELECT ip.id, ic.namecompany as company, it.nametype as type, package_name, coverage_amount FROM insurance_package as ip INNER JOIN insurance_company as ic ON ip.company_id = ic.id INNER JOIN insurance_type as it ON ip.insur_type_id = it.id ORDER BY ip.id ASC LIMIT $1 OFFSET $2'

        const result = await db.query(query, [per_page, offset])

        const countResult = await db.query('SELECT COUNT(*)::int as total FROM insurance_package')

        res.json({ data: result.rows, total: countResult.rows[0].total })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const result = await db.query(
            'SELECT id, package_name FROM insurance_package order by created_at desc' 
        )

         res.json({ data: result.rows })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    const {id} = req.params

    try {
         const query = 'SELECT id, company_id, insurance_type_id, package_name, coverage_amount FROM insurance_package WHERE id = $1'
        const result = await db.query(query, [Number(id)])

         res.json({ data: result.rows[0] })
    } catch (err) {
         console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {company_id, insurance_type_id, package_name, coverage_amount} = req.body

    try {
        const result = await db.query('SELECT * FROM  insurance_package WHERE id = $1',[id])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' })
        }

        const old = result.rows[0]

        await db.query('UPDATE  insurance_package SET company_id = $1, insurance_type_id = $2, package_name = $3, coverage_amount = $4  WHERE id = $5', 
            [
                company_id          !== undefined ? Number(company_id)          :  old.company_id,             
                insurance_type_id   !== undefined ? Number(insurance_type_id)   :  old.insurance_type_id,             
                package_name        !== undefined ? package_name                : old.package_name,             
                coverage_amount     !== undefined ? Number(coverage_amount)     :  old.coverage_amount,             
                id
            ])

        res.json({msg: 'อัปเดตข้อมูลแพ็กเกจสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.remove = async(req, res) => {
    try {
         const {id} = req.params

         await db.query('DELETE FROM insurance_package WHERE id = $1', [id])

         res.json({msg: 'ลบข้อมูลแพ็กเกจสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}