const express = require('express');
const { authCheck } = require('../middleware/authCheck');
const { create, getOrderDetail, confirmOrder } = require('../controllers/order');
const router = express.Router();

router.post('/order/create', authCheck, create)
router.get('/order/detail/:id', authCheck, getOrderDetail)
router.patch('/order/:id', authCheck, confirmOrder)

module.exports = router