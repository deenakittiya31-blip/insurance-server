const express = require('express')
const { register, login, currentUser, statusLoginWith, getLoginWithSetting } = require('../controllers/auth')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const router = express.Router()

router.post('/login', login)
router.put('/status-loginwith/:id', authCheck, roleCheck(['admin', 'staff']), statusLoginWith)
router.put('/setting-loginwith', authCheck, roleCheck(['admin', 'staff']), getLoginWithSetting)
router.post('/current-user', authCheck, currentUser)
router.post('/register', authCheck, roleCheck(['admin']), register)

module.exports = router