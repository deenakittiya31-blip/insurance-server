const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { removeQuotation, createQuotationFields, createFields, readQuotationFields, updateQuotationField } = require('../controllers/quotation');
const router = express.Router();

router.post('/create-quotation/fields', authCheck, roleCheck(['admin']), createQuotationFields)
router.get('/read-quotation/fields/:id', authCheck, roleCheck(['admin']), readQuotationFields)
router.put('/update-quotation/fields', authCheck, roleCheck(['admin']), updateQuotationField)
//สำหรับสร้าง quotation และ fields แบบ key-in
router.post('/create-quotationandfields', authCheck, roleCheck(['admin']), createFields)
router.delete('/delete-quotation/:id', authCheck, roleCheck(['admin']), removeQuotation)

module.exports = router