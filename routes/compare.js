const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createCompare, getDetailCompare, comparePDF, compareJPG, listCompare, removeCompare, detailCompareEdite, searchCompare, listPinCompare, copyCompare, testData, removeCompareMember } = require('../controllers/compare');
const router = express.Router();

router.get('/list-compare/page', authCheck, roleCheck(['admin', 'staff']), listCompare)
router.get('/list-pin/page', authCheck, roleCheck(['admin', 'staff']), listPinCompare)
router.get('/detail-compare/:id', authCheck, roleCheck(['admin', 'staff']), getDetailCompare)
router.get('/edit-compare/:id', authCheck, detailCompareEdite)
router.get('/pdf-compare/:id', authCheck, comparePDF)
router.get('/test-compare/:id',  authCheck, testData)
router.get('/jpg-compare/:id', authCheck, compareJPG)

router.post('/search-compare', authCheck, roleCheck(['admin', 'staff']), searchCompare)
router.post('/create-compare', authCheck, roleCheck(['admin', 'staff']), createCompare)
router.post('/copy-compare', authCheck, roleCheck(['admin', 'staff']), copyCompare)

router.delete('/delete-compare/:id', authCheck, removeCompare)
router.delete('/delete-compare-member/:id', authCheck, removeCompareMember)


module.exports = router