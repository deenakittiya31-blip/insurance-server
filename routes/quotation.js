const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { getQuotationDetail, createQuotation } = require('../controllers/quotation');
const router = express.Router();

router.post('/create-quotation', authCheck, roleCheck(['admin']), createQuotation)
router.get('/detail-capare/:id', authCheck, roleCheck(['admin']), getQuotationDetail)

module.exports = router