const express = require('express')
const { sendMessageLine } = require('../controllers/messageLine')
const router = express.Router()

router.post('/send-message', authCheck, roleCheck(['admin', 'staff']), sendMessageLine)

module.exports = router