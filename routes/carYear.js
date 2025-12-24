const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, list, update, remove } = require('../controllers/carYear')
const router = express.Router()

router.post('/create-year', authCheck, create)
router.get('/list-year/page', list)
router.put('/update-year/:id', authCheck, update)
router.delete('/delete-year/:id', authCheck, remove)

module.exports = router