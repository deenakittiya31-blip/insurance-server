const express = require('express');
const { authCheck } = require('../middleware/authCheck');
const { create, getOrderDetail, confirmOrder, deleteOrder, getHistoryOrder, listOrder, updateTrackingOrder, changeStatusOrder } = require('../controllers/order');
const router = express.Router();

router.post('/order/create', authCheck, create)
router.get('/order/detail/:id', authCheck, getOrderDetail)
router.patch('/order/:id', authCheck, confirmOrder)
router.get('/order', authCheck, getHistoryOrder)
router.delete('/order/:id', authCheck, deleteOrder)
router.put('/order/status/:id', authCheck, changeStatusOrder)
router.put('/order/tracking/:id', authCheck, updateTrackingOrder)
router.get('/admin/order', authCheck, listOrder)

module.exports = router