const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, read } = require('../controllers/insurancCompany')
const router = express.Router()

router.post('/create-company', authCheck, roleCheck(['admin']), create)
router.get('/list-company/page', list)
router.get('/list-company-select', list)
router.get('/read-company/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-company/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-company/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router