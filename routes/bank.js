const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, listSelect, read, update, is_active, remove, createGroupCredit, listGroupCredit, listSelectGroupCredit, updateGroupCredit, isActiveGroupCredit, removeGroupCredit, readToSeeGroup } = require('../controllers/bank')
const router = express.Router()

router.post('/create-bank', authCheck, roleCheck(['admin']), create)
router.get('/list-bank', list)
router.get('/list-bank-select',listSelect)
router.get('/read-bank/:id', authCheck, roleCheck(['admin']),read)
router.put('/update-bank/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-bank/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-bank/:id', authCheck, remove)

//grop credit card
router.post('/create-group-credit', authCheck, roleCheck(['admin']), createGroupCredit)
router.get('/list-group-credit', listGroupCredit)
router.get('/list-group-credit-select',listSelectGroupCredit)
router.get('/read-group-credit/:id', authCheck, roleCheck(['admin']),readToSeeGroup)
router.put('/update-group-credit/:id', authCheck, roleCheck(['admin']), updateGroupCredit)
router.put('/status-group-credit/:id', authCheck, roleCheck(['admin']), isActiveGroupCredit)
router.delete('/delete-group-credit/:id', authCheck, roleCheck(['admin']), removeGroupCredit)


module.exports = router