const express = require('express');
const router = express.Router();
const bulkController = require('../controllers/bulk');

// 📝 BULK CREATE
router.post('/users', bulkController.bulkCreateUsers);
router.post('/books', bulkController.bulkCreateBooks);
router.post('/rentals', bulkController.bulkCreateRentals);

// 🗑️ BULK DELETE
router.post('/delete-users', bulkController.bulkDeleteUsers);
router.post('/delete-books', bulkController.bulkDeleteBooks);

module.exports = router;
