const express = require('express');
const { registerMember, listMember , sendDocumentToMember, searchMember, readMember, updateMember, removeMember } = require('../controllers/member');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const router = express.Router();

router.post('/register-member', registerMember)
router.get('/list-members', authCheck , roleCheck(['admin', 'staff']), listMember)
router.get('/read-member/:id', authCheck , roleCheck(['admin', 'staff']), readMember)
router.patch('/update-member/:id', authCheck , roleCheck(['admin', 'staff']), updateMember)
router.delete('/delete-member/:id', authCheck , roleCheck(['admin', 'staff']), removeMember)
router.post('/search-member', authCheck, roleCheck(['admin', 'staff']), searchMember)
router.post('/sendDocument-tomember', authCheck , roleCheck(['admin', 'staff']), sendDocumentToMember)

module.exports = router