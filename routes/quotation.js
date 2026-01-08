const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createQuotation, removeQuotation } = require('../controllers/quotation');
const router = express.Router();

router.post('/create-quotation/fields', authCheck, roleCheck(['admin']), createQuotation)
router.delete('/delete-quotation/:id', authCheck, roleCheck(['admin']), removeQuotation)

module.exports = router