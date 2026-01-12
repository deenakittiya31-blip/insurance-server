const express = require('express')
const {authCheck, roleCheck} = require('../middleware/authCheck')
const { akson, testdata } = require('../controllers/aksonocr')
const router = express.Router()

router.post('/akson', authCheck, roleCheck(['admin']), akson)
router.get('/data', testdata)

module.exports = router