const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    //  1. ดึง Token จาก Header ช่อง Authorization
    // หน้าบ้านมักจะส่งมาในรูปแบบ: "Bearer <ก้อน_Token>"
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    //  เคสที่ 1: หน้าบ้านไม่ได้ส่ง Token มาในระบบ 
    if (!token) {
        return res.status(401).json({ 
            error: true, 
            message: " ไม่พบ Token " 
        });
    }

    try {

        const secret = process.env.JWT_SECRET; 
        const decoded = jwt.verify(token, secret);

        req.user = decoded;
        next(); 

    } catch (err) {
        // เคสที่ 2: บัตรหมดอายุ หรือ ถูกแก้ข้อมูล (บัตรปลอม)
        return res.status(403).json({ 
            error: true, 
            message: "Token ไม่ถูกต้อง หรือ หมดอายุการใช้งานแล้ว" 
        });
    }
};

module.exports = verifyToken;