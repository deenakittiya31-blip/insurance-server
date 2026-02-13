const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, read, listSelect, listCompanyTheme, is_active } = require('../controllers/insurancCompany')
const router = express.Router()

router.post('/create-company', authCheck, roleCheck(['admin']), create)
router.get('/list-company', list)
router.get('/list-company-select', listSelect)
router.get('/list-company-theme', listCompanyTheme)
router.get('/read-company/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-company/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-company/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-company/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router