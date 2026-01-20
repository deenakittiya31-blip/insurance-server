const express = require('express');
const { lineBotReply } = require('../controllers/lineBot');
const router = express.Router();

router.post('/webhook', lineBotReply)

module.exports = router