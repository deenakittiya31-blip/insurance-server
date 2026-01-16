const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { listModel, removeModel, updateModelFields, readModel, readFieldsModel, createFieldsModel, removeFieldModel, createModel } = require('../controllers/custommodel');
const router = express.Router();

// route ของโมเดลดึงข้อมูลเอกสาร
router.post('/create-model', authCheck, roleCheck(['admin']), createModel)
router.get('/list-model/page', authCheck, roleCheck(['admin']), listModel)
router.delete('/delete-model/:id', authCheck, roleCheck(['admin']), removeModel)
router.get('/read-model/:id', authCheck, roleCheck(['admin']), readModel)

// route ของฟิลด์ที่ใช้ดึงข้อมูลเอกสาร
router.post('/create-fieldsmodel', authCheck, roleCheck(['admin']), createFieldsModel)
router.get('/read-fieldsmodel/:id', authCheck, roleCheck(['admin']), readFieldsModel)
router.patch('/update-fieldsmodel/:id', authCheck, roleCheck(['admin']), updateModelFields)
router.delete('/delete-fieldsmodel/:id', authCheck, roleCheck(['admin']), removeFieldModel)

module.exports = router