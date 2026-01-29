const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { removeQuotation, createQuotationFields, createFields, pinQuotation } = require('../controllers/quotation');
const router = express.Router();

router.post('/create-quotation/fields', authCheck, roleCheck(['admin']), createQuotationFields)
router.post('/pin-quotation/:id', authCheck, roleCheck(['admin']), pinQuotation)

//สำหรับสร้าง quotation และ fields แบบ key-in
router.post('/create-quotationandfields', authCheck, roleCheck(['admin']), createFields)
router.delete('/delete-quotation/:id', authCheck, roleCheck(['admin']), removeQuotation)

module.exports = router