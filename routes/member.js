const express = require('express');
const { registerMember, listMember } = require('../controllers/member');
const roter = express.Router();

roter.post('/register-member', registerMember)
roter.get('/list-member', listMember)

module.exports = roter