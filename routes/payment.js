const express = require('express');
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { listPayment } = require('../controllers/payment');
const router = express.Router();

router.get('/list-payment', authCheck, listPayment)

module.exports = router