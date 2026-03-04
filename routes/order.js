const express = require('express');
const { authCheck } = require('../middleware/authCheck');
const { create, getOrderDetail, confirmOrder, deleteOrder, getHistoryOrder } = require('../controllers/order');
const router = express.Router();

router.post('/order/create', authCheck, create)
router.get('/order/detail/:id', authCheck, getOrderDetail)
router.patch('/order/:id', authCheck, confirmOrder)
router.get('/order', authCheck, getHistoryOrder)
router.delete('/order/:id', authCheck, deleteOrder)

module.exports = router