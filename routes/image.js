const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { createImages, removeImages } = require('../controllers/image')
const router = express.Router()

router.post('/images', authCheck, createImages)
router.post('/removeImages', authCheck, removeImages)

module.exports = router