const express = require('express');
const { authCheck } = require('../middleware/authCheck');
const { create } = require('../controllers/order');
const router = express.Router();

router.post('/order/create', authCheck, create)

module.exports = router