const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/checkRole');
const books = require('../controllers/books');

// Member: ดูหนังสือได้
router.get('/books', verifyToken, books.get);
router.get('/books/:id', verifyToken, books.getById);

// Admin: จัดการหนังสือ
router.post('/books/addBook', verifyToken, isAdmin, books.post);
router.patch('/books/update/:id', verifyToken, isAdmin, books.updateBook);
router.delete('/books/delete/:id', verifyToken, isAdmin, books.delete);

module.exports = router;