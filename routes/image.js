const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { createImages, removeImages } = require('../controllers/image')
const router = express.Router()

router.post('/images', authCheck, roleCheck(['admin']), createImages)
router.post('/removeImages', authCheck, roleCheck(['admin']), removeImages)

module.exports = router