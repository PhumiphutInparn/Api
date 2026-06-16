const express = require('express');
const router = express.Router();
const rentalsController = require('../controllers/rentals');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');
const {isAdmin} = require('../middleware/checkRole')

// (Member)

router.get('/rentals', verifyToken, rentalsController.get);
router.post('/rentals/create', verifyToken, rentalsController.requestRental);   

//Admin 


// อัปเดตสถานะบิล (คืนหนังสือ, ทำหาย)
router.patch('/rentals/update/:id', verifyToken, isAdmin, rentalsController.patch);
router.delete('/rentals/delete/:id', verifyToken, isAdmin, rentalsController.delete);
router.put('/approve/:rental_id', verifyToken, isAdmin, rentalsController.approveRental);


module.exports = router;