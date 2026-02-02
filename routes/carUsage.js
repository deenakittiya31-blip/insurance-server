const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect, createUsageType, listUsageType, readUsageType, updateUsageType, removeUsageType } = require('../controllers/carUsage')
const router = express.Router()

router.post('/create-carusage', authCheck, roleCheck(['admin']), create)
router.get('/list-carusage', list)
router.get('/list-carusage-select', listSelect)
router.put('/update-carusage/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-carusage/:id', authCheck, roleCheck(['admin']), remove)

//car usage type
router.post('/create-carusagetype', authCheck, roleCheck(['admin']), createUsageType)
router.get('/list-carusagetype/page', authCheck, roleCheck(['admin']),listUsageType)
router.get('/read-carusagetype/:id', authCheck, roleCheck(['admin']), readUsageType)
router.patch('/update-carusagetype/:id', authCheck, roleCheck(['admin']), updateUsageType)
router.delete('/delete-carusagetype/:id', authCheck, roleCheck(['admin']), removeUsageType)

module.exports = router