const express = require('express')
const {authCheck, roleCheck} = require('../middleware/authCheck')
const { akson, testdata, createQuotation } = require('../controllers/aksonocr')
const router = express.Router()

//อันนี้เป็นแบบสร้าง quotation พร้อม ocr
router.post('/akson', authCheck, roleCheck(['admin', 'staff']), akson)
router.post('/quotation', authCheck, roleCheck(['admin', 'staff']), createQuotation)

module.exports = router