const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, update, remove, list, listSelect, read } = require('../controllers/insurancType')
const router = express.Router()

router.post('/create-type', authCheck, roleCheck(['admin']), create)
router.get('/list-type', list)
router.get('/list-type-select', listSelect)
router.get('/read-type/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-type/:id', authCheck, update)
router.delete('/delete-type/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router