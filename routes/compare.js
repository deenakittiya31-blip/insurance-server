const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { getQuotationDetail, createCompare } = require('../controllers/compare');
const router = express.Router();

router.post('/create-compare', authCheck, roleCheck(['admin']), createCompare)
router.get('/detail-capare/:id', authCheck, roleCheck(['admin']), getQuotationDetail)

module.exports = router