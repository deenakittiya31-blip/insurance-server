const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, update, remove, list, listSelect, read } = require('../controllers/insurancType')
const router = express.Router()

router.post('/create-type', authCheck, create)
router.get('/list-type', list)
router.get('/list-type-select', listSelect)
router.get('/read-type/:id', authCheck, read)
router.put('/update-type/:id', authCheck, update)
router.delete('/delete-type/:id', authCheck, remove)

module.exports = router