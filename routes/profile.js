const express = require('express');
const { authCheck } = require('../middleware/authCheck');
const { updateProfileUser, readProfileUser } = require('../controllers/profile');
const router = express.Router();

router.get('/read-profile', authCheck, readProfileUser)
router.put('/update-profile', authCheck, updateProfileUser)

module.exports = router