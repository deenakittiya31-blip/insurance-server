const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, list, update, remove, read } = require('../controllers/compulsoryInsur')
const router = express.Router()

router.post('/create-compulsory', authCheck, create)
router.get('/list-compulsory', list)
router.get('/read-compulsory/:id', authCheck, read)
router.put('/update-compulsory/:id', authCheck, update)
router.delete('/delete-compulsory/:id', authCheck, remove)

module.exports = router