const express = require('express')
const { register, login, loginLine, loginGoogle, currentUser } = require('../controllers/auth')
const { authCheck } = require('../middleware/authCheck')
const router = express.Router()

router.post('/login', login)
router.post('/current-user', authCheck, currentUser)
router.post('/login-line', loginLine)
router.post('/login-google', loginGoogle)
router.post('/register', register)

module.exports = router