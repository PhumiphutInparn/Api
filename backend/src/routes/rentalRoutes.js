const express = require('express');
const router = express.Router();
const rentalsController = require('../controllers/rentals');
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/checkRole');

router.get('/rentals', verifyToken, rentalsController.get);
router.post('/rentals/borrow', verifyToken, rentalsController.borrowBook);    

router.patch('/rentals/update/:id', verifyToken, isAdmin, rentalsController.patch);
router.delete('/rentals/delete/:id', verifyToken, isAdmin, rentalsController.delete);

module.exports = router;