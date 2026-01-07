const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createCompare } = require('../controllers/compare');
const router = express.Router();

router.post('/create-compare', authCheck, roleCheck(['admin']), createCompare)

module.exports = router