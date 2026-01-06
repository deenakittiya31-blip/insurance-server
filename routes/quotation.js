const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { getQuotationDetail } = require('../controllers/quotation');
const router = express.Router();

router.get('/detail-capare/:id', authCheck, roleCheck(['admin']), getQuotationDetail)

module.exports = router