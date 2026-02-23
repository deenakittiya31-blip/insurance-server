// routes/policy.route.js
const express = require('express')
const router = express.Router()
const { getActivePolicy, getPolicyList, createPolicy, updatePolicy, publishPolicy, deletePolicy } = require('../controllers/policy.controller')
const { authCheck, roleCheck } = require('../middleware/authCheck')

// Public
router.get('/public-policy/:type', getActivePolicy)

// Admin
router.get('/policy/:type', authCheck, roleCheck(['admin']), getPolicyList)
router.post('/policy', authCheck, roleCheck(['admin']), createPolicy)
router.put('/policy/:id', authCheck, roleCheck(['admin']), updatePolicy)
router.patch('/policy/:id/publish', authCheck, roleCheck(['admin']), publishPolicy)
router.delete('/policy/:id', authCheck, roleCheck(['admin']), deletePolicy)

module.exports = router