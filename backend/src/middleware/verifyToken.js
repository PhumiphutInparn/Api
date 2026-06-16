const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    // หน้าบ้านไม่ได้ส่ง Token มาในระบบ 
    if (!token) {
        return res.status(401).json({ 
            error: true, 
            message: " ไม่พบ Token " 
        });
    }

    try {

        const secret = process.env.SERECT; 
        const decoded = jwt.verify(token, secret);

        req.user = decoded;
        next(); 

    } catch (err) {
        
        return res.status(403).json({ 
            error: true, 
            message: "Token ไม่ถูกต้อง หรือ หมดอายุการใช้งานแล้ว" 
        });
    }
};

module.exports = verifyToken;