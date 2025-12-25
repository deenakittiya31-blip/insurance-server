const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck')
const { list, create, remove, update } = require('../controllers/carModel')
const router = express.Router()

router.post('/create-carmodel', authCheck, roleCheck(['admin']), create)
router.get('/list-carmodel/page', list)
router.put('/update-carmodel/:id', authCheck, roleCheck(['admin']), update)
router.delete('/delete-carmodel/:id', authCheck, roleCheck(['admin']), remove)

module.exports = router