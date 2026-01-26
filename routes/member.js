const express = require('express');
const { registerMember, listMember , sendDocumentToMember, searchMember, readMember, updateMember } = require('../controllers/member');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const router = express.Router();

router.post('/register-member', registerMember)
router.get('/list-members', authCheck , roleCheck(['admin']), listMember)
router.get('/read-member/:id', authCheck , roleCheck(['admin']), readMember)
router.patch('/update-member/:id', authCheck , roleCheck(['admin']), updateMember)
router.delete('/delete-member/:id', authCheck , roleCheck(['admin']), listMember)
router.post('/search-member', authCheck, roleCheck(['admin']), searchMember)
router.post('/sendDocument-tomember', authCheck , roleCheck(['admin']), sendDocumentToMember)

module.exports = router