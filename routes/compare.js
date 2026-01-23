const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createCompare, getDetailCompare, comparePDF, compareJPG, listCompare, removeCompare, detailCompareEdite, searchCompare } = require('../controllers/compare');
const router = express.Router();

router.get('/list-compare/page', authCheck, roleCheck(['admin']), listCompare)
router.get('/search-compare', authCheck, roleCheck(['admin']), searchCompare)
router.post('/create-compare', authCheck, roleCheck(['admin']), createCompare)
router.get('/detail-compare/:id', authCheck, roleCheck(['admin']), getDetailCompare)
router.get('/edit-compare/:id',  detailCompareEdite)
router.delete('/delete-compare/:id', authCheck, roleCheck(['admin']), removeCompare)
router.get('/pdf-compare/:id', authCheck, roleCheck(['admin']), comparePDF)
router.get('/jpg-compare/:id', authCheck, roleCheck(['admin']), compareJPG)

module.exports = router