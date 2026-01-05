const express = require('express')
const {authCheck, roleCheck} = require('../middleware/authCheck')
const { akson } = require('../controllers/aksonocr')
const router = express.Router()

router.post('/akson', authCheck, roleCheck(['admin']), akson)

module.exports = router