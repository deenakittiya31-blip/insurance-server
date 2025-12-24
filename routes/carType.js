const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, list, update, remove } = require('../controllers/carType')
const router = express.Router()

router.post('/create-cartype', authCheck, create)
router.get('/list-cartype', list)
router.put('/update-cartype/:id', authCheck, update)
router.delete('/delete-cartype/:id', authCheck, remove)

module.exports = router