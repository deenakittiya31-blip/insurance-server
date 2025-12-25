const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect } = require('../controllers/carUsage')
const router = express.Router()

router.post('/create-carusage', authCheck, roleCheck(['admin']), create)
router.get('/list-carusage/page', list)
router.get('/list-carusage-select', listSelect)
router.put('/update-carusage/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-carusage/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router