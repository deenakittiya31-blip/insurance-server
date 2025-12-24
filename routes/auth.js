const express = require('express')
const { register, login, loginLine, loginGoogle } = require('../controllers/auth')
const router = express.Router()

router.post('/login', login)
router.post('/login-line', loginLine)
router.post('/login-google', loginGoogle)
router.post('/register', register)

module.exports = router