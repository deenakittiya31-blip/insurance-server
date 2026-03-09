const express = require('express')
const { authCheck, roleCheck } = require('../middleware/authCheck');
const { updateSettingSecret, listSettingSecret } = require('../controllers/setting');
const router = express.Router();

router.post('/setting', authCheck, roleCheck(['admin']), listSettingSecret  )
router.put('/setting/:id', authCheck, roleCheck(['admin']), updateSettingSecret)

module.exports = router