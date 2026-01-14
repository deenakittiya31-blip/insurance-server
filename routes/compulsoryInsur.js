const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, read, listOption } = require('../controllers/compulsoryInsur')
const router = express.Router()

router.post('/create-compulsory', authCheck, roleCheck(['admin']), create)
router.get('/list-compulsory/page', list)
router.get('/option-compulsory', listOption)
router.get('/read-compulsory/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-compulsory/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-compulsory/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router