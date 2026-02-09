const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, listSelect, update, is_active, remove, addMembers } = require('../controllers/tag')
const router = express.Router()

router.post('/create-tag', authCheck, roleCheck(['admin', 'staff']), create)
router.post('/add-membertotag', authCheck, roleCheck(['admin', 'staff']), addMembers)
router.get('/list-tag/page', authCheck, roleCheck(['admin', 'staff']), list)
router.get('/list-tag-select', authCheck, roleCheck(['admin', 'staff']), listSelect)
router.put('/update-tag/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-tag/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-tag/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router