const express = require('express');
const router = express.Router();
const users = require('../controllers/user');

router.get('/users', users.get);       
router.post('/users/create', users.post);
router.patch('/users/:id', users.patch);
router.delete('/users/:id', users.delete);

module.exports = router;