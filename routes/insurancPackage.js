const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect, read, readEdit, copy, StatusIsActive } = require('../controllers/insurancPackage')
const router = express.Router()

router.post('/create-package', authCheck, roleCheck(['admin', 'staff']), create)
router.get('/list-package', authCheck, roleCheck(['admin', 'staff']), list)
router.get('/list-package-select', authCheck, roleCheck(['admin', 'staff']), listSelect)
router.get('/read-package/:id', authCheck, roleCheck(['admin', 'staff']), read)
router.get('/readedit-package/:id', authCheck, roleCheck(['admin', 'staff']), readEdit)
router.get('/copy-package/:id', authCheck, roleCheck(['admin', 'staff']), copy)
router.put('/status-package/:id', authCheck, roleCheck(['admin', 'staff']), StatusIsActive)
router.patch('/update-package/:id', authCheck, roleCheck(['admin', 'staff']), update)
router.delete('/delete-package/:id', authCheck, roleCheck(['admin', 'staff']), remove)

module.exports = router