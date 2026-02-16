const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { list, read, update, is_active, remove } = require('../controllers/user')
const router = express.Router()

router.get('/list-user', authCheck, roleCheck(['admin']), list)
router.get('/read-user/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-user/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-user/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-user/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router