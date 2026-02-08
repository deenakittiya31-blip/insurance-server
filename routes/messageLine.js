const express = require('express')
const { sendMessageLine } = require('../controllers/messageLine')
const { authCheck, roleCheck } = require('../middleware/authCheck');
const router = express.Router()

router.post('/send-message', authCheck, roleCheck(['admin', 'staff']), sendMessageLine)

module.exports = router