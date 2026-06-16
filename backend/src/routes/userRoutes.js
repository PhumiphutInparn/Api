const express = require('express');
const router = express.Router();
const userController = require('../controllers/user'); 
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/checkRole');
const upload = require('../middleware/upload'); 


// Admin

router.get('/users', verifyToken, isAdmin, userController.get);       
router.get('/users/:id', verifyToken, isAdmin, userController.getById);   
router.post('/users/create', verifyToken, isAdmin, userController.post);
router.patch('/users/edit/:id', verifyToken, isAdmin, userController.patch);
router.delete('/users/delete/:id', verifyToken, isAdmin, userController.delete);


//โซนอัปโหลดรูปโปรไฟล์ (Member)

router.post('/upload-profile', verifyToken, upload.single('image'), userController.uploadProfilePicture);

module.exports = router;