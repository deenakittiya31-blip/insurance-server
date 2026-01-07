const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createQuotation } = require('../controllers/quotation');
const router = express.Router();

router.post('/create-quotation/fields', authCheck, roleCheck(['admin']), createQuotation)

module.exports = router