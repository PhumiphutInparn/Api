const dbCon = require("../config/db");

// 1. [READ] ดึงข้อมูลหนังสือทั้งหมด + ค้นหา + โชว์ชื่อคนยืมปัจจุบัน (LEFT JOIN)
exports.get = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const offset = (page - 1) * limit;

    const { search, status } = req.query;

    try {
        let filterSql = " WHERE b.deleted_at IS NULL";
        let queryParams = [];

        if (search) {
            filterSql += " AND (b.title LIKE ? OR b.author LIKE ?)";
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern);
        }

        if (status) {
            filterSql += " AND b.status = ?";
            queryParams.push(status);
        }

        const countSql = `SELECT COUNT(*) AS total FROM Books b ${filterSql}`;
        const [countResult] = await dbCon.promise().query(countSql, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // ดึงข้อมูลหนังสือ พร้อม LEFT JOIN ไปหาตาราง Rentals (ที่ status = 'active') และ Users
        const dataSql = `
            SELECT b.book_id, b.title, b.author, b.isbn, b.status,
                   u.first_name AS borrower_name, 
                   r.rent_date, r.due_date
            FROM Books b
            LEFT JOIN Rentals r ON b.book_id = r.book_id AND r.status = 'active' AND r.deleted_at IS NULL
            LEFT JOIN Users u ON r.user_id = u.user_id
            ${filterSql}
            ORDER BY b.book_id DESC 
            LIMIT ? OFFSET ?
        `;
        
        const finalParams = [...queryParams, limit, offset];
        const [rows] = await dbCon.promise().query(dataSql, finalParams);

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

// 2. [CREATE] เพิ่มหนังสือเล่มใหม่
exports.post = async (req, res) => {
    const { title, author, isbn, status } = req.body;

    
    if (!title || !author || !isbn) {
        return res.status(400).json({ error: true, message: "กรุณากรอกชื่อหนังสือ, ชื่อผู้แต่ง และ ISBN ให้ครบถ้วน" });
    }

    try {
        
        const sql = "INSERT INTO Books (title, author, isbn, status) VALUES (?, ?, ?, ?)";
        const [result] = await dbCon.promise().query(sql, [title, author, isbn, status || 'available']);

        return res.status(201).json({
            error: false,
            message: "New book added successfully",
            inserted_id: result.insertId
        });
    } catch (err) {
        
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: true, message: "เลข ISBN นี้มีอยู่ในระบบแล้ว" });
        }
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 3. [UPDATE] แก้ไขสถานะหรือข้อมูลหนังสือ
exports.patch = async (req, res) => {
    const book_id = req.params.id;
    const { status } = req.body;

    if (!book_id || !status) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัสหนังสือและสถานะใหม่" });
    }

   
    const validStatuses = ['available', 'rented', 'lost'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: true, message: "สถานะไม่ถูกต้อง (ต้องเป็น available, rented หรือ lost เท่านั้น)" });
    }

    try {
        const sql = "UPDATE Books SET status = ? WHERE book_id = ? AND deleted_at IS NULL";
        const [result] = await dbCon.promise().query(sql, [status, book_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบรหัสหนังสือนี้ในระบบ" });
        }

        return res.status(200).json({ error: false, message: "Book updated successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};


exports.delete = async (req, res) => {
    const book_id = req.params.id;

    if (!book_id) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัสหนังสือที่ต้องการลบ" });
    }

    try {
        const checkSql = "SELECT status FROM Books WHERE book_id = ? AND deleted_at IS NULL";
        const [checkResult] = await dbCon.promise().query(checkSql, [book_id]);

        if (checkResult.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบรหัสหนังสือนี้ในระบบ" });
        }

        
        if (checkResult[0].status === 'rented') {
            return res.status(409).json({ 
                error: true, 
                message: "ไม่สามารถลบหนังสือเล่มนี้ได้ เนื่องจากกำลังถูกยืมอยู่ (rented)" 
            });
        }

        const deleteSql = "UPDATE Books SET deleted_at = NOW() WHERE book_id = ? AND deleted_at IS NULL";
        await dbCon.promise().query(deleteSql, [book_id]);

        return res.status(200).json({ error: false, message: "Book Deleted Successfully" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

exports.getById = async (req, res) => {
    const book_id = req.params.id; // ดึง ID มาจาก URL

    try {
        // ใช้ LEFT JOIN เพื่อดูว่าหนังสือเล่มนี้ใครกำลังยืมอยู่ด้วย
        const sql = `
            SELECT b.book_id, b.title, b.author, b.isbn, b.status,
                   u.first_name AS borrower_name, 
                   r.rent_date, r.due_date
            FROM Books b
            LEFT JOIN Rentals r ON b.book_id = r.book_id AND r.status = 'active' AND r.deleted_at IS NULL
            LEFT JOIN Users u ON r.user_id = u.user_id
            WHERE b.book_id = ? AND b.deleted_at IS NULL
        `;
        
        const [books] = await dbCon.promise().query(sql, [book_id]);

        // ถ้าหาหนังสือไม่เจอ
        if (books.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบข้อมูลหนังสือเล่มนี้ในระบบ" });
        }

        // ส่งข้อมูลเล่มที่หาเจอ (ตัวที่ 0) กลับไปให้หน้าบ้าน
        return res.status(200).json({
            error: false,
            data: books[0] 
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};