const express = require('express')
const { register, login, loginLine, loginGoogle, currentUser, statusLoginWith, getStatusLoginWith } = require('../controllers/auth')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const router = express.Router()

router.post('/login', login)
router.put('/status-loginwith/:id', authCheck, roleCheck(['admin']), statusLoginWith)
router.get('/get-loginwith', authCheck, roleCheck(['admin']), getStatusLoginWith)
router.post('/current-user', authCheck, currentUser)
router.post('/login-line', loginLine)
router.post('/login-google', loginGoogle)
router.post('/register', register)

module.exports = router