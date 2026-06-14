const express = require('express');
const router = express.Router();
const finesController = require('../controllers/fines');


router.get('/', finesController.get);
router.get('/user/:user_id', finesController.getUserFines);
router.patch('/pay/:id', finesController.payFine);
router.post('/process-overdue', finesController.processOverdueBooks);

module.exports = router;
