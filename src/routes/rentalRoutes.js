const express = require('express');
const router = express.Router();
const rentals = require('../controllers/rentals');


router.get('/rentals', rentals.get);
router.post('/rentals', rentals.post);
router.patch('/rentals/:id', rentals.patch);
router.delete('/rentals/:id', rentals.delete);

module.exports = router;