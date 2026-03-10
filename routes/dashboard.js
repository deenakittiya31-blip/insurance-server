const express = require('express')
const router = express.Router()
const { authCheck } = require('../middleware/authCheck')
const { dashboard } = require('../controllers/dashboard')

router.get('/dashboard/summary', authCheck, dashboard)

module.exports = router