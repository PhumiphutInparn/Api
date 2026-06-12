// src/controllers/auth.js
const dbCon = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// [POST] ระบบสมัครสมาชิก (Register)
exports.register = async (req, res) => {
    const { email, password, first_name, last_name, role } = req.body;

    if (!email || !password || !first_name) {
        return res.status(400).json({ error: true, message: "กรุณากรอกอีเมล, รหัสผ่าน และชื่อจริงให้ครบถ้วน" });
    }

    const validRole = (role && ['admin', 'member'].includes(role)) ? role : 'member';

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = "INSERT INTO Users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)";
        const [result] = await dbCon.promise().query(sql, [email, hashedPassword, first_name, last_name, validRole]);

        return res.status(201).json({
            error: false,
            message: "User Registered Successfully",
            inserted_id: result.insertId
        });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: true, message: "อีเมลนี้ถูกใช้งานแล้วในระบบ" });
        }
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// [POST] ระบบเข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: true, message: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    try {
        const sql = "SELECT * FROM Users WHERE email = ? AND deleted_at IS NULL";
        const [users] = await dbCon.promise().query(sql, [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: true, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ error: true, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        const payload = {
            user_id: user.user_id,
            role: user.role
        };

        const token = jwt.sign(payload, 'mySuperSecretKey', { expiresIn: '1d' });

        return res.status(200).json({
            error: false,
            message: "เข้าสู่ระบบสำเร็จ",
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                role: user.role
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};