const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { list, create, remove, update, read, listBy, is_active } = require('../controllers/carModel')
const router = express.Router()

router.post('/create-carmodel', authCheck, roleCheck(['admin']), create)
// router.get('/car-model', listBy)
router.post('/car-model/list-by', listBy)
router.get('/list-carmodel', list)
router.put('/update-carmodel/:id', authCheck, roleCheck(['admin']), update)
router.put('/status-carmodel/:id', authCheck, roleCheck(['admin']), is_active)
router.get('/read-carmodel/:id', authCheck, roleCheck(['admin']), read)
router.delete('/delete-carmodel/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router