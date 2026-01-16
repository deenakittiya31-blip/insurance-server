const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { listModel, removeModel, updateModelFields,  createModelAndFields } = require('../controllers/custommodel');
const router = express.Router();

router.post('/create-modelandfields', authCheck, roleCheck(['admin']), createModelAndFields)
router.get('/list-model/page', authCheck, roleCheck(['admin']), listModel)
router.delete('/delete-model/:id', authCheck, roleCheck(['admin']), removeModel)
router.patch('/update-model/:id', authCheck, roleCheck(['admin']), updateModelFields)

module.exports = router