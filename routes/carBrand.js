const express = require('express')
const { authCheck } = require('../middleware/authCheck')
const upload = require('../middleware/upload')
const { create, list, remove, listSelect, createImages, removeImages, read, update } = require('../controllers/carBrand')
const router = express.Router()

router.post('/create-carbrand', authCheck, create)
router.get('/list-carbrand', list)
router.get('/list-carbrand-select', listSelect)
router.get('/read-carbrand/:id', read)
router.put('/update-carbrand/:id', update)
router.delete('/delete-carbrand/:id', authCheck, remove)


module.exports = router