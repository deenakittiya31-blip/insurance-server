const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, list, remove, update, read } = require('../controllers/insrancPremium')
const router = express.Router()

router.post('/create-premium', authCheck, create)
router.get('/list-premium', list)
router.get('/read-premium/:id', authCheck, read)
router.put('/update-premium/:id', authCheck, update)
router.delete('/delete-premium/:id', authCheck, remove)

module.exports = router