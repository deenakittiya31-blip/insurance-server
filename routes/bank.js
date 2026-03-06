const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, listSelect, read, update, is_active, remove } = require('../controllers/bank')
const router = express.Router()

router.post('/create-bank', authCheck, roleCheck(['admin']), create)
router.get('/list-bank', list)
router.get('/list-bank-select',listSelect)
router.get('/read-bank/:id', authCheck, roleCheck(['admin']),read)
router.put('/update-bank/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-bank/:id', authCheck, roleCheck(['admin']), is_active)
router.delete('/delete-bank/:id', authCheck, remove)


module.exports = router