const express = require('express')
const { create, list, listSelect, read, update, is_active, remove } = require('../controllers/promotion')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const router = express.Router()

router.post('/create-promotion', authCheck, roleCheck(['admin']), create)
router.get('/list-promotion', authCheck, roleCheck(['admin']), list)
router.get('/list-promotion-select',listSelect)
router.get('/read-promotion/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-promotion/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-promotion/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-promotion/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router