const express = require('express');
const router = express.Router();
const bulkController = require('../controllers/bulk');
const verifyToken = require('../middleware/verifyToken');
const {isAdmin} = require('../middleware/checkRole')

//  BULK CREATE
router.post('/users',verifyToken,isAdmin, bulkController.bulkCreateUsers);
router.post('/books', verifyToken,isAdmin,bulkController.bulkCreateBooks);
router.post('/rentals', verifyToken,isAdmin,bulkController.bulkCreateRentals);

//  BULK DELETE
router.post('/delete-users', verifyToken,isAdmin,bulkController.bulkDeleteUsers);
router.post('/delete-books', verifyToken,isAdmin,bulkController.bulkDeleteBooks);

module.exports = router;
