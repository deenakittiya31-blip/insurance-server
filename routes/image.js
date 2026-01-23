const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { createImages, removeImages, uploadDocument } = require('../controllers/image')
const router = express.Router()

router.post('/images', authCheck, roleCheck(['admin']), createImages)
// router.post('/document', authCheck, roleCheck(['admin']), uploadDocument)
router.post('/removeImages', authCheck, roleCheck(['admin']), removeImages)

module.exports = router