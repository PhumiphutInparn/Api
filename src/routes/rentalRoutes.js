const express = require('express');
const router = express.Router();
const rentals = require('../controllers/rentals');

router.get('/rentals', rentals.get);
router.post('/rentals/create', rentals.post);     
router.post('/rentals/return/:id', rentals.patch); 
router.delete('/rentals/delete/:id', rentals.delete);

module.exports = router;