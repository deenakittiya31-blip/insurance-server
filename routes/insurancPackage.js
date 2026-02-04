const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect, read, readEdit, is_active } = require('../controllers/insurancPackage')
const router = express.Router()

router.post('/create-package', authCheck, roleCheck(['admin', 'staff']), create)
router.get('/list-package/page', authCheck, roleCheck(['admin', 'staff']), list)
router.get('/list-package-select', listSelect)
router.get('/read-package/:id', authCheck, roleCheck(['admin', 'staff']), read)
router.get('/readedit-package/:id', authCheck, roleCheck(['admin', 'staff']), readEdit)
router.put('/update-package/:id', authCheck, roleCheck(['admin', 'staff']), update)
router.put('/status-package/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-package/:id', authCheck, roleCheck(['admin', 'staff']), remove)

module.exports = router