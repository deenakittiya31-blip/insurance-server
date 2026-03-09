const db = require('../config/database')

exports.listSettingSecret = async(req, res) => {
    try {
        const result = await db.query('select * from config order by id')

        res.json({data: result.rows})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'Server error'})
    }
}

exports.updateSettingSecret = async(req, res) => {
    try {
        const { secret } = req.body;
        const { id } = req.params;

        await db.query('UPDATE config SET secret_config = $1 WHERE id = $2', [secret, id])

        res.json({msg: 'แก้ไขสำเร็จ'})  
    } catch (err) {
        console.log(err)
        res.status(500).json({message: 'server errer'}) 
    }
}