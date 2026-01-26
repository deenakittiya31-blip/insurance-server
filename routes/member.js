const express = require('express');
const { registerMember, listMember , sendDocumentToMember, searchMember } = require('../controllers/member');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const router = express.Router();

router.post('/register-member', registerMember)
router.get('/list-member/sort', authCheck , roleCheck(['admin']), listMember)
router.post('/search-member', authCheck, roleCheck(['admin']), searchMember)
router.post('/sendDocument-tomember', authCheck , roleCheck(['admin']), sendDocumentToMember)

module.exports = router