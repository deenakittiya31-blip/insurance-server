const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { createCompare, getDetailCompare, comparePDF, compareJPG } = require('../controllers/compare');
const router = express.Router();

router.post('/create-compare', authCheck, roleCheck(['admin']), createCompare)
router.get('/detail-compare/:id', authCheck, roleCheck(['admin']), getDetailCompare)
router.get('/pdf-compare/:id', authCheck, roleCheck(['admin']), comparePDF)
router.get('/jpg-compare/:id', authCheck, roleCheck(['admin']), compareJPG)

module.exports = router