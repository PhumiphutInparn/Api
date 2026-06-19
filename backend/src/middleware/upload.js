const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 1. ดึง ID จาก Token (ต้องแน่ใจว่า verifyToken ทำงานก่อนหน้านี้)
        const userId = req.user.user_id; 
        
        // 2. กำหนด Path: รวมกับ uploads และ profiles ตามที่พี่มี
        const userDir = path.join('uploads', 'profiles', String(userId));

        // 3. ถ้าโฟลเดอร์ยังไม่มี ให้สร้างขึ้นมาทันที
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir); 
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase(); 
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });
module.exports = upload;