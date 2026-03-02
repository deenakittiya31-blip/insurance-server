const express = require('express');
const { authCheck } = require('../middleware/authCheck');
const { create, getOrderDetail } = require('../controllers/order');
const router = express.Router();

router.post('/order/create', authCheck, create)
router.get('/order/detail/:id', authCheck, getOrderDetail)

module.exports = router