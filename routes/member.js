const express = require('express');
const { registerMember, listMember } = require('../controllers/member');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const router = express.Router();

router.post('/register-member', registerMember)
router.get('/list-member', authCheck , roleCheck, listMember)

module.exports = router