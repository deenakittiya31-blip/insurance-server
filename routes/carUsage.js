const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect, createUsageType, listUsageType, readUsageType, updateUsageType, removeUsageType, listUsageTypeSelect, is_active, statusUsageType, statusUsageTypeIsSee } = require('../controllers/carUsage')
const router = express.Router()

router.post('/create-carusage', authCheck, roleCheck(['admin']), create)
router.get('/list-carusage', list)
router.get('/list-carusage-select', listSelect)
router.put('/update-carusage/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-carusage/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-carusage/:id', authCheck, roleCheck(['admin']), remove)

//car usage type
router.post('/create-carusagetype', authCheck, roleCheck(['admin']), createUsageType)
router.get('/list-carusagetype/page', authCheck, roleCheck(['admin']),listUsageType)
router.get('/select-carusagetype', authCheck, roleCheck(['admin']),listUsageTypeSelect)
router.get('/read-carusagetype/:id', authCheck, roleCheck(['admin']), readUsageType)
router.patch('/update-carusagetype/:id', authCheck, roleCheck(['admin']), updateUsageType)
router.put('/status-carusagetype/:id', authCheck, roleCheck(['admin']), statusUsageType)
router.put('/status-issee/:id', authCheck, roleCheck(['admin']), statusUsageTypeIsSee)
router.delete('/delete-carusagetype/:id', authCheck, roleCheck(['admin']), removeUsageType)

module.exports = router