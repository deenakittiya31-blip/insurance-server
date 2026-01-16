const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { listModel, removeModel, updateModelFields, readModel, readFieldsModel, createFieldsModel, removeFieldModel } = require('../controllers/custommodel');
const router = express.Router();

router.post('/create-fieldsmodel', authCheck, roleCheck(['admin']), createFieldsModel)
router.get('/list-model/page', authCheck, roleCheck(['admin']), listModel)
router.get('/read-model/:id', authCheck, roleCheck(['admin']), readModel)
router.get('/read-fieldsmodel/:id', authCheck, roleCheck(['admin']), readFieldsModel)
router.patch('/update-fieldsmodel/:id', authCheck, roleCheck(['admin']), updateModelFields)
router.delete('/delete-model/:id', authCheck, roleCheck(['admin']), removeModel)
router.delete('/delete-fieldsmodel/:id', authCheck, roleCheck(['admin']), removeFieldModel)

module.exports = router