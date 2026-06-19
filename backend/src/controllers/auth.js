// src/controllers/auth.js
const dbCon = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// [POST] ระบบสมัครสมาชิก (Register)
exports.register = async (req, res) => {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: true, message: "กรุณากรอกอีเมล, รหัสผ่าน และชื่อ-นามสกุล ให้ครบถ้วน" });
    }


    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = "INSERT INTO Users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, 'member')";
        const [result] = await dbCon.promise().query(sql, [email, hashedPassword, first_name, last_name]);

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

        const secret = process.env.SERECT;
        const token = jwt.sign({
            user_id: user.user_id,  
            email: user.email, 
            role: user.role
        } 
        , secret , {expiresIn: '1h'})

        
        const payload = {
            user_id: user.user_id,
            role: user.role
            };

        
        console.log(` [LOGIN SUCCESS] User ID: ${user.user_id} เข้าสู่ระบบเมื่อ: ${new Date().toLocaleString('th-TH')}`);
        const logSql = "INSERT INTO LoginLogs (user_id) VALUES (?)";
        await dbCon.promise().query(logSql, [user.user_id]);
    
        return res.status(200).json({ error: false,
            message: "เข้าสู่ระบบสำเร็จ",
            user_id: user.user_id,
            first_name:user.first_name,
            last_name_name:user.last_name,
            role: user.role,
            token,});

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};