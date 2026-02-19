const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createCompare, getDetailCompare, comparePDF, compareJPG, listCompare, removeCompare, detailCompareEdite, searchCompare, listPinCompare, copyCompare, testData } = require('../controllers/compare');
const router = express.Router();

router.get('/list-compare/page', authCheck, roleCheck(['admin', 'staff']), listCompare)
router.get('/list-pin/page', authCheck, roleCheck(['admin', 'staff']), listPinCompare)
router.get('/detail-compare/:id', authCheck, roleCheck(['admin', 'staff']), getDetailCompare)
router.get('/edit-compare/:id',  detailCompareEdite)
router.get('/pdf-compare/:id', authCheck, roleCheck(['admin', 'staff']), comparePDF)
router.get('/test-compare/:id',  testData)
router.get('/jpg-compare/:id', authCheck, roleCheck(['admin', 'staff']), compareJPG)

router.post('/search-compare', authCheck, roleCheck(['admin', 'staff']), searchCompare)
router.post('/create-compare', authCheck, roleCheck(['admin', 'staff']), createCompare)
router.post('/copy-compare', authCheck, roleCheck(['admin', 'staff']), copyCompare)

router.delete('/delete-compare/:id', authCheck, roleCheck(['admin', 'staff']), removeCompare)


module.exports = router