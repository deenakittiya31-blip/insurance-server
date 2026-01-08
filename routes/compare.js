const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createCompare, getDetailCompare } = require('../controllers/compare');
const router = express.Router();

router.post('/create-compare', authCheck, roleCheck(['admin']), createCompare)
router.get('/detail-compare/:id', authCheck, roleCheck(['admin']), getDetailCompare)

module.exports = router