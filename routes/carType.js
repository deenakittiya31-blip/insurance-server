const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect, read } = require('../controllers/carType')
const router = express.Router()

router.post('/create-cartype', authCheck, roleCheck(['admin']), create)
router.get('/list-cartype/page', list)
router.get('/list-cartype-select', listSelect)
router.get('/read-cartype/:id', authCheck, roleCheck(['admin']),read)
router.put('/update-cartype/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-cartype/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router