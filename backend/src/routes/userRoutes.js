const express = require('express');
const router = express.Router();
const userController = require('../controllers/user'); 
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/checkRole');
const upload = require('../middleware/upload'); 


router.get('/users', verifyToken, isAdmin, userController.get);       
router.get('/users/:id', verifyToken, (req, res, next) => {
    const id = req.params.id;
    if (req.user.role === 'member' && req.user.user_id != id) {
        return res.status(403).json({ error: true, message: "ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนตัวของสมาชิก" });
    }
    next(); 
}, userController.getById); 


router.patch('/users/edit/:id', verifyToken, userController.patch);
router.delete('/users/delete/:id', verifyToken, userController.delete);
 

router.post('/upload-profile', verifyToken, upload.single('image'), userController.uploadProfilePicture);

module.exports = router;