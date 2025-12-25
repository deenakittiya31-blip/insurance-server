const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, list, update, remove, read } = require('../controllers/compulsoryInsur')
const router = express.Router()

router.post('/create-compulsory', authCheck, roleCheck(['admin']), create)
router.get('/list-compulsory', list)
router.get('/read-compulsory/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-compulsory/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-compulsory/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router