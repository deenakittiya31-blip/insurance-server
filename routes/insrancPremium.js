const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, remove, update, read, isActivePremium, searchPremiumToCompare, createPremiumToCompare } = require('../controllers/insrancPremium')
const router = express.Router()

router.post('/create-premium', authCheck, roleCheck(['admin', 'staff']), create)
router.post('/create-premiumtocompare', authCheck, createPremiumToCompare)
router.post('/search-premiumtocompare', searchPremiumToCompare)
router.get('/list-premium', list)
router.get('/read-premium/:id', authCheck, roleCheck(['admin', 'staff']), read)
router.put('/status-premium/:id', authCheck, roleCheck(['admin', 'staff']), isActivePremium)
router.patch('/update-premium/:id', authCheck, roleCheck(['admin', 'staff']), update)
router.delete('/delete-premium/:id', authCheck, roleCheck(['admin', 'staff']), remove)

module.exports = router