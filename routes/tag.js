const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, listSelect, update, is_active, remove } = require('../controllers/tag')
const router = express.Router()

router.post('/create-tag', authCheck, roleCheck(['admin']), create)
router.get('/list-tag/page', list)
router.get('/list-tag-select', listSelect)
router.put('/update-tag/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-tag/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-tag/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router