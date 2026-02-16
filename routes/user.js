const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { list, read, update, is_active, remove } = require('../controllers/user')
const router = express.Router()

router.get('/list-promotion', authCheck, roleCheck(['admin']), list)
router.get('/read-promotion/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-promotion/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-promotion/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-promotion/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router