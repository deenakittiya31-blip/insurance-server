const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove } = require('../controllers/group_member')
const router = express.Router()

router.post('/create-groupmember', authCheck, roleCheck(['admin', 'staff']), create)
router.get('/list-groupmember', authCheck, roleCheck(['admin', 'staff']), list)
router.put('/update-groupmember/:id', authCheck, roleCheck(['admin', 'staff']), update)
router.delete('/delete-groupmember', authCheck, roleCheck(['admin', 'staff']), remove)

module.exports = router