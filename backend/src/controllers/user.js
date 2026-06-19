const dbCon = require("../config/db");
const bcrypt = require("bcrypt");

exports.get = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
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
            SELECT user_id, email, first_name, last_name, role, created_at, profile_picture 
            FROM Users
            ${filterSql}
            ORDER BY user_id DESC
            LIMIT ? OFFSET ?
        `;

        const finalParams = [...queryParams, limit, offset];
        const [rows] = await dbCon.promise().query(Sql, finalParams);

        rows.forEach(user => {
            if (user.profile_picture) {
                user.profile_picture = `http://localhost:3000/${user.profile_picture}`;
            }
        });

        return res.status(200).json({
            error: false,
            data: rows,
            pagination: { current_page: page, per_page: limit, total_items: totalItems, total_pages: totalPages }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: true, message: "ไม่พบไฟล์รูปภาพ" });
        const userId = req.user.user_id;
        const filePath = `uploads/profiles/${userId}/${req.file.filename}`;
        
        await dbCon.promise().query("UPDATE Users SET profile_picture = ? WHERE user_id = ?", [filePath, userId]);

        res.status(200).json({ 
            message: "อัปโหลดสำเร็จ", 
            imageUrl: `http://localhost:3000/${filePath}` 
        });
    } catch (error) {
        console.error("Upload Error: ", error);
        return res.status(500).json({ error: true, message: "ระบบขัดข้อง", details: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const [users] = await dbCon.promise().query("SELECT * FROM Users WHERE user_id = ? AND deleted_at IS NULL", [req.params.id]);
        if (users.length === 0) return res.status(404).json({ error: true, message: "ไม่พบข้อมูล" });

        const user = users[0];
        if (user.profile_picture) {
            user.profile_picture = `http://localhost:3000/${user.profile_picture}`;
        }
        return res.status(200).json({ error: false, data: user });
    } catch (err) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

exports.patch = async (req, res) => {
    const user_id = req.params.id;
    const { first_name, last_name, password, email, profile_picture, role } = req.body;

    try {
        let updateFields = [];
        let queryParams = [];

        if (first_name !== undefined) { updateFields.push("first_name = ?"); queryParams.push(first_name); }
        if (last_name !== undefined) { updateFields.push("last_name = ?"); queryParams.push(last_name); }
        if (email !== undefined) { updateFields.push("email = ?"); queryParams.push(email); }
        if (profile_picture !== undefined) { updateFields.push("profile_picture = ?"); queryParams.push(profile_picture); }
        if (role !== undefined) { updateFields.push("role = ?"); queryParams.push(role); }
        
        if (password) { 
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push("password_hash = ?"); 
            queryParams.push(hashedPassword); 
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: true, message: "ไม่มีข้อมูลที่ต้องการอัปเดต" });
        }

        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ? AND deleted_at IS NULL`;
        queryParams.push(user_id); 

        const [result] = await dbCon.promise().query(sql, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบรหัสผู้ใช้งานนี้ในระบบ" });
        }

        return res.status(200).json({ error: false, message: "User updated successfully" });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: true, message: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" });
        }
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

exports.delete = async (req, res) => {
    const user_id = req.params.id;

    if (!user_id) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัส User ID ที่ต้องการลบ" });
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