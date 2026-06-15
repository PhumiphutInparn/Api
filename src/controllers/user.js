const dbCon = require("../config/db");
const bcrypt = require("bcrypt");

// 1. [READ] ดึงข้อมูลผู้ใช้งานทั้งหมด + ระบบค้นหา (Search) และแบ่งหน้า (Pagination)
exports.get = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const offset = (page - 1) * limit;

    const { search, role } = req.query;
    
    try {
        let filterSql = " WHERE deleted_at IS NULL";
        let queryParams = []; 

        if (search) {
            filterSql += " AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (role) {
            filterSql += " AND role = ?";
            queryParams.push(role);
        }

        const countSql = `SELECT COUNT(*) AS total FROM Users ${filterSql}`;
        const [countResult] = await dbCon.promise().query(countSql, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const Sql = `
            SELECT user_id, email, first_name, last_name, role, created_at   
            FROM Users
            ${filterSql}
            ORDER BY user_id DESC
            LIMIT ? OFFSET ?
        `;
        
        const finalParams = [...queryParams, limit, offset]; 
        const [rows] = await dbCon.promise().query(Sql, finalParams);

        return res.status(200).json({
            error: false,
            data: rows,
            pagination: {
                current_page: page,
                per_page: limit,
                total_items: totalItems,
                total_pages: totalPages
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 2. [CREATE] เพิ่มผู้ใช้งานใหม่ (Register พร้อม Auto-Hash)
exports.post = async (req, res) => {
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
            message: "User Created Successfully",
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

// 3. [UPDATE] แก้ไขข้อมูลผู้ใช้งาน (แบบยืดหยุ่น ส่งอะไรมาแก้อันนั้น)
exports.patch = async (req, res) => {
    const user_id = req.params.id;
    const { first_name, last_name, role, password } = req.body;

    try {
        let updateFields = [];
        let queryParams = [];

        if (first_name) { updateFields.push("first_name = ?"); queryParams.push(first_name); }
        if (last_name) { updateFields.push("last_name = ?"); queryParams.push(last_name); }
        
        if (role && ['admin', 'member'].includes(role)) { 
            updateFields.push("role = ?"); 
            queryParams.push(role); 
        }
        
        if (password) { 
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push("password_hash = ?"); 
            queryParams.push(hashedPassword); 
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: true, message: "ไม่มีข้อมูลที่ต้องการอัปเดต" });
        }

        const sql = `UPDATE Users SET ${updateFields.join(', ')} WHERE user_id = ? AND deleted_at IS NULL`;
        queryParams.push(user_id); 

        const [result] = await dbCon.promise().query(sql, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบรหัสผู้ใช้งานนี้ในระบบ" });
        }

        return res.status(200).json({ error: false, message: "User updated successfully" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 4. [DELETE] ลบผู้ใช้งาน (Soft Delete พร้อมระบบดักเช็กหนี้หนังสือค้างส่ง)
exports.delete = async (req, res) => {
    const user_id = req.params.id;

    if (!user_id) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัสผู้ใช้งานที่ต้องการลบ" });
    }

    try {
        const checkRentalsSql = "SELECT rental_id FROM Rentals WHERE user_id = ? AND status = 'active' AND deleted_at IS NULL";
        const [activeRentals] = await dbCon.promise().query(checkRentalsSql, [user_id]);

        if (activeRentals.length > 0) {
            return res.status(409).json({ 
                error: true, 
                message: "ไม่สามารถลบบัญชีผู้ใช้ได้ เนื่องจากยังมีรายการหนังสือที่ยังไม่ได้คืนค้างอยู่" 
            });
        }

        const sql = "UPDATE Users SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL";
        const [result] = await dbCon.promise().query(sql, [user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบรหัสผู้ใช้งานนี้ในระบบ หรืออาจถูกลบไปแล้ว" });
        }

        return res.status(200).json({ error: false, message: "User Deleted Successfully" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};