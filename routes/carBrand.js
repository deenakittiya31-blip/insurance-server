const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, remove, listSelect, read, update } = require('../controllers/carBrand')
const router = express.Router()

router.post('/create-carbrand', authCheck, roleCheck(['admin']), create)
router.get('/list-carbrand', list)
router.get('/list-carbrand-select',listSelect)
router.get('/read-carbrand/:id', authCheck, roleCheck(['admin']),read)
router.put('/update-carbrand/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-carbrand/:id', authCheck, remove)


module.exports = router