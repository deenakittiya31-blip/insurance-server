const express = require('express')
const {authCheck, roleCheck} = require('../middleware/authCheck')
const { akson, testdata, createQuotation } = require('../controllers/aksonocr')
const router = express.Router()

router.post('/akson', authCheck, roleCheck(['admin']), akson)
router.post('/quotation', authCheck, roleCheck(['admin']), createQuotation)
router.get('/data', testdata)

module.exports = router