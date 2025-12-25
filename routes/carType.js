const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect } = require('../controllers/carType')
const router = express.Router()

router.post('/create-cartype', authCheck, roleCheck(['admin']), create)
router.get('/list-cartype', list)
router.get('/list-cartype-select', listSelect)
router.put('/update-cartype/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-cartype/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router