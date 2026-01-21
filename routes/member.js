const express = require('express');
const { registerMember, listMember, sendImageToMember } = require('../controllers/member');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const router = express.Router();

router.post('/register-member', registerMember)
router.get('/list-member', authCheck , roleCheck(['admin']), listMember)
router.post('/sendimage-tomember', authCheck , roleCheck(['admin']), sendImageToMember)

module.exports = router