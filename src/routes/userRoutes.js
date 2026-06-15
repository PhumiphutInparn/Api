const express = require('express');
const router = express.Router();
const users = require('../controllers/user');
const verifyToken = require('../middleware/verifyToken');
const {isAdmin} = require('../middleware')

router.get('/users', verifyToken,isAdmin,users.get);       
router.get('/users/:id', verifyToken,isAdmin,users.getById);   
router.post('/users/create', verifyToken,isAdmin,users.post);
router.patch('/users/edit/:id', verifyToken,isAdmin,users.patch);
router.delete('/users/delete/:id', verifyToken,isAdmin,users.delete);

module.exports = router;