const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { list, create, remove, update } = require('../controllers/carModel')
const router = express.Router()

router.post('/create-carmodel', authCheck, create)
router.get('/list-carmodel/page', list)
router.put('/update-carmodel/:id', authCheck, update)
router.delete('/delete-carmodel/:id', authCheck, remove)

module.exports = router