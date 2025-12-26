const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect, read } = require('../controllers/insurancPackage')
const router = express.Router()

router.post('/create-package', authCheck, roleCheck(['admin']), create)
router.get('/list-package/page', list)
router.get('/list-package-select', listSelect)
router.get('/read-package/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-package/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-package/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router