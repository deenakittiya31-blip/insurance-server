const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { listModel, removeModel, updateModelFields,  createModelAndFields, readModel, readFieldsModel } = require('../controllers/custommodel');
const router = express.Router();

router.post('/create-modelandfields', authCheck, roleCheck(['admin']), createModelAndFields)
router.get('/list-model/page', authCheck, roleCheck(['admin']), listModel)
router.get('/read-model/:id', authCheck, roleCheck(['admin']), readModel)
router.get('/read-fieldsmodel/:id', authCheck, roleCheck(['admin']), readFieldsModel)
router.delete('/delete-model/:id', authCheck, roleCheck(['admin']), removeModel)
router.patch('/update-fieldsmodel/:id', authCheck, roleCheck(['admin']), updateModelFields)

module.exports = router