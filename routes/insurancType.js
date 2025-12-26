const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, update, remove, list, listSelect, read, is_active } = require('../controllers/insurancType')
const router = express.Router()

router.post('/create-type', authCheck, roleCheck(['admin']), create)
router.get('/list-type/page', list)
router.get('/list-type-select', listSelect)
router.get('/read-type/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-type/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-type/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-type/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router