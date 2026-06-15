const express = require('express');
const router = express.Router();
const rentals = require('../controllers/rentals');
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/checkRole');


// User
router.get('/rentals',verifyToken, isAdmin, rentals.get);
// User
router.post('/rentals/create', verifyToken,rentals.post);   

//Admin
router.patch('/rentals/update/:id', verifyToken,isAdmin,rentals.patch);
router.delete('/rentals/delete/:id', verifyToken, isAdmin, rentals.delete);

module.exports = router;