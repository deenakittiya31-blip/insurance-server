const express = require('express');
const { roleCheck } = require('../middleware/authCheck');
const router = express.Router();

router.post('/webhook', authCheck, roleCheck(['admin']), )

module.exports = router