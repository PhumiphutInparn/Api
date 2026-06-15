const express = require('express');
const router = express.Router();
const users = require('../controllers/user');

router.get('/users', users.get);       
router.get('/users/:id', users.getById);   
router.post('/users/create', users.post);
router.patch('/users/edit/:id', users.patch);
router.delete('/users/delete/:id', users.delete);

module.exports = router;