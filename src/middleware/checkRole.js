exports.isAdmin = (req, res, next) => {
    // req.user จะถูกแกะและส่งต่อมาจากด่าน verifyToken
    if (req.user && req.user.role === 'admin') {
        next(); // สิทธิ์ถูกต้อง ปล่อยให้ผ่านไปทำ Controller ถัดไปได้
    } else {
        // ถ้าเป็น member หรือสิทธิ์อื่น จะถูกเตะออกตรงนี้ทันที
        return res.status(403).json({ 
            error: true, 
            message: "Forbidden: สิทธิ์การเข้าถึงถูกปฏิเสธ (สงวนไว้สำหรับ Admin เท่านั้น)" 
        });
    }
};



 //ใช้สำหรับเส้นสมาชิกทั่วไปทำเท่านั้น
exports.isMember = (req, res, next) => {
    if (req.user && req.user.role === 'member') {
        next(); 
    } else {
        return res.status(403).json({ 
            error: true, 
            message: "Forbidden: สิทธิ์การเข้าถึงถูกปฏิเสธ (เฉพาะสมาชิกทั่วไปเท่านั้น)" 
        });
    }
};