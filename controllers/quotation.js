const db = require('../config/database')

exports.createQuotation = async(req, res) => {
    try {
        const { data, error } = await db
            .from('quotation_compare')
            .insert({})
            .select('id')
            .single()

        if (error) throw error

        const id = data.id

        const q_id = `Q${String(id).padStart(3, '0')}`

        const { error: updateError } = await db
            .from('quotation_compare')
            .update({ q_id })
            .eq('id', id)

        if (updateError) throw updateError

        //return q_id
        res.json({ q_id })

    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}

exports.getQuotationDetail = async(req, res) => {
    try {
        console.log('hello')
    } catch (err) {
        console.log(err)
        res.status(500).json({msg: 'Server error'})
    }
}