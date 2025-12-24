const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, list, update, remove, read } = require('../controllers/insurancCompany')
const upload = require('../middleware/upload')
const router = express.Router()

router.post('/create-company', authCheck, upload.single('logo_url'), create)
router.get('/list-company', list)
router.get('/list-company-select', list)
router.get('/read-company/:id', authCheck, read)
router.put('/update-company/:id', authCheck, update)
router.delete('/delete-company/:id', authCheck, remove)

module.exports = router