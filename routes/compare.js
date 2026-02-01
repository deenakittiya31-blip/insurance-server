const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createCompare, getDetailCompare, comparePDF, compareJPG, listCompare, removeCompare, detailCompareEdite, searchCompare, listPinCompare } = require('../controllers/compare');
const router = express.Router();

router.get('/list-compare/page', authCheck, roleCheck(['admin', 'staff']), listCompare)
router.get('/list-pin/page', authCheck, roleCheck(['admin', 'staff']), listPinCompare)
router.post('/search-compare', authCheck, roleCheck(['admin', 'staff']), searchCompare)
router.post('/create-compare', authCheck, roleCheck(['admin', 'staff']), createCompare)
router.get('/detail-compare/:id', authCheck, roleCheck(['admin', 'staff']), getDetailCompare)
router.get('/edit-compare/:id',  detailCompareEdite)
router.delete('/delete-compare/:id', authCheck, roleCheck(['admin', 'staff']), removeCompare)
router.get('/pdf-compare/:id', authCheck, roleCheck(['admin', 'staff']), comparePDF)
router.get('/jpg-compare/:id', authCheck, roleCheck(['admin', 'staff']), compareJPG)

module.exports = router