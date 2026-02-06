const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, remove, update, read, is_active } = require('../controllers/insrancPremium')
const router = express.Router()

router.post('/create-premium', authCheck, roleCheck(['admin', 'staff']), create)
router.get('/list-premium/page', list)
router.get('/read-premium/:id', authCheck, roleCheck(['admin', 'staff']), read)
router.put('/update-premium/:id', authCheck, roleCheck(['admin', 'staff']), update)
router.put('/status-premium/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-premium/:id', authCheck, roleCheck(['admin', 'staff']), remove)

module.exports = router