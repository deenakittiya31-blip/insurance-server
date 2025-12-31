const express = require('express')
const {authCheck, roleCheck} = require('../middleware/authCheck')
const { aigen } = require('../controllers/aigen')
const router = express.Router()

router.post('/aigen', authCheck, roleCheck(['admin']), aigen)

module.exports = router