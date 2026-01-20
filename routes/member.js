const express = require('express');
const { registerMember } = require('../controllers/member');
const roter = express.Router();

roter.post('/register-member', registerMember)

module.exports = roter