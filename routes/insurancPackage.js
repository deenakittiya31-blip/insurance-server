const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect, read } = require('../controllers/insurancPackage')
const router = express.Router()

router.post('/create-package', authCheck, create)
router.get('/list-package', list)
router.get('/list-package-select', listSelect)
router.get('/read-package/:id', authCheck, read)
router.put('/update-package/:id', authCheck, update)
router.delete('/delete-package/:id', authCheck, remove)

module.exports = router