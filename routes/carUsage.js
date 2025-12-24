const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const { create, list, update, remove, listSelect } = require('../controllers/carUsage')
const router = express.Router()

router.post('/create-carusage', authCheck, create)
router.get('/list-carusage/page', list)
router.get('/list-carusage-select', listSelect)
router.put('/update-carusage/:id', authCheck, update)
router.delete('/delete-carusage/:id', authCheck, remove)

module.exports = router