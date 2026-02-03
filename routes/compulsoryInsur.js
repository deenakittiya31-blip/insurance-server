const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, read, listOption, statusCompulsory, listOptionPackage } = require('../controllers/compulsoryInsur')
const router = express.Router()

router.post('/create-compulsory', authCheck, roleCheck(['admin']), create)
router.get('/list-compulsory/page', list)
router.get('/option-compulsory/:id', listOption)
router.get('/option-compulsory-package', listOptionPackage)
router.get('/read-compulsory/:id', authCheck, roleCheck(['admin']), read)
router.patch('/update-compulsory/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-compulsory/:id', authCheck, roleCheck(['admin']), statusCompulsory)
router.delete('/delete-compulsory/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router