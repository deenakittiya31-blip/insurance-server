const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { create, list, read, update, remove } = require('../controllers/address')
const router = express.Router()

router.post('/create-address', authCheck, create)
router.get('/list-address', authCheck, list)
router.get('/read-address/:id', authCheck, read)
router.put('/update-address/:id', authCheck, update)
router.delete('/delete-address/:id', authCheck, remove)

module.exports = router