const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, read, listSelect, is_active } = require('../controllers/carYear')
const router = express.Router()

router.post('/create-year', authCheck, roleCheck(['admin']), create)
router.get('/list-year', list)
router.get('/list-year-select', listSelect)
router.get('/read-year/:id', authCheck, roleCheck(['admin']), read)
router.put('/update-year/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-year/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-year/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router