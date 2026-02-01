const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { listModel, removeModel, updateModelFields, readModel, readFieldsModel, createFieldsModel, removeFieldModel, createModel, updateAdditional } = require('../controllers/custommodel');
const router = express.Router();

// route ของโมเดลดึงข้อมูลเอกสาร
router.post('/create-model', authCheck, roleCheck(['admin', 'staff']), createModel)
router.get('/list-model/page', authCheck, roleCheck(['admin', 'staff']), listModel)
router.delete('/delete-model/:id', authCheck, roleCheck(['admin', 'staff']), removeModel)
router.get('/read-model/:id', authCheck, roleCheck(['admin', 'staff']), readModel)

// route ของฟิลด์ที่ใช้ดึงข้อมูลเอกสาร
router.post('/create-fieldsmodel', authCheck, roleCheck(['admin', 'staff']), createFieldsModel)
router.get('/read-fieldsmodel/:id', authCheck, roleCheck(['admin', 'staff']), readFieldsModel)
router.patch('/update-fieldsmodel/:id', authCheck, roleCheck(['admin', 'staff']), updateModelFields)
router.put('/update-additional/:id', authCheck, roleCheck(['admin', 'staff']), updateAdditional)
router.delete('/delete-fieldsmodel/:id', authCheck, roleCheck(['admin', 'staff']), removeFieldModel)

module.exports = router