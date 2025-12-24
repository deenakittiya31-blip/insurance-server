const connection = require('../config/database');

exports.create = async(req, res) => {
    try {
        const { company_id, insurance_type_id, package_name, coverage_amount } = req.body

        const query = 'INSERT INTO insurance_package(company_id, insurance_type_id, package_name, coverage_amount) VALUES(?, ?, ?, ?)';

        await connection.query(query, [company_id, insurance_type_id, package_name, coverage_amount])

        res.json({ msg: 'เพิ่มข้อมูลแพ็คเกจสำเร็จ' })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.list = async(req, res) => {
    try {
        const [row] = await connection.query(
            'SELECT ip.id, ic.nameCompany as company, it.nameType as type, package_name, coverage_amount FROM insurance.insurance_package as ip INNER JOIN insurance.insurance_company as ic ON ip.company_id = ic.id INNER JOIN insurance.insurance_type as it ON ip.insurance_type_id = it.id'
        )

         res.json({ data: row })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.listSelect = async(req, res) => {
    try {
        const [row] = await connection.query(
            'SELECT id, package_name FROM insurance.insurance_package' 
        )

         res.json({ data: row })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.read = async(req, res) => {
    const {id} = req.params

    try {
         const query = 'SELECT id, company_id, insurance_type_id, package_name, coverage_amount FROM insurance.insurance_package WHERE id = ?'
        const [row] = await connection.query(query, [parseInt(id)])

         res.json({ data: row[0] })
    } catch (err) {
         console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}

exports.update = async(req, res) => {
    const {id} = req.params
    const {company_id, insurance_type_id, package_name, coverage_amount} = req.body

    try {
        const [rows] = await connection.query('SELECT * FROM  insurance_package WHERE id = ?',[id])

        await connection.query('UPDATE  insurance_package SET company_id = ?, insurance_type_id = ?, package_name = ?, coverage_amount = ?  WHERE id = ?', 
            [
                parseInt(company_id)         || rows[0].company_id,
                parseInt(insurance_type_id)  || rows[0].insurance_type_id,
                package_name                 || rows[0].package_name,
                parseInt(coverage_amount)    || rows[0].coverage_amount,
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

         await connection.query('DELETE FROM insurance_company WHERE id = ?', [id])

         res.json({msg: 'ลบข้อมูลแพ็กเกจสำเร็จ'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}