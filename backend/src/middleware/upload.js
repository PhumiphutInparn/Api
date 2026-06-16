const multer = require('multer');
const path = require('path');
const fs = require('fs');

// สร้างโฟลเดอร์อัตโนมัติ 
const uploadDir = 'uploads/profiles/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ตั้งค่าที่เก็บไฟล์และวิธีตั้งชื่อไฟล์
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // บอกให้เซฟรูปไปที่โฟลเดอร์นี้
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase(); 
        

        // ตัวอย่าง: profile-25-1718500000.jpg
       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.user.user_id + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null, true); 
    } else {
        cb(new Error('อัปโหลดได้เฉพาะไฟล์รูปภาพ .jpg ที่มีขนาดไฟล์ไม่เกิน 5 MB'), false); // เตะกลับ
    }
};

// รวมตั้งค่า Multer
const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } 
});


module.exports = upload;