const express = require('express')
const {authCheck, roleCheck} = require('../middleware/authCheck')
const { akson } = require('../controllers/aksonocr')
const router = express.Router()

//อันนี้เป็นแบบสร้าง quotation พร้อม ocr
router.post('/akson', authCheck, roleCheck(['admin', 'staff']), akson)

module.exports = router