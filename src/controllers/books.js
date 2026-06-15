const dbCon = require("../config/db");

// 1. [READ] ดึงข้อมูลหนังสือทั้งหมด + ค้นหา + โชว์ชื่อคนยืมปัจจุบัน (LEFT JOIN) + แบ่งหน้า
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

// 3. [UPDATE] แก้ไขข้อมูลหนังสือ (ปรับปรุงใหม่: ยืดหยุ่น ส่งอะไรมาแก้อันนั้น)
exports.patch = async (req, res) => {
    const rental_id = req.params.id;
    // รับค่าจากหน้าบ้าน (let แทน const เพราะเราอาจจะต้องแทรกแซงเปลี่ยนค่ามัน)
    let { rental_status, new_due_date } = req.body;

    if (!rental_status) {
        return res.status(400).json({ 
            error: true, 
            message: "กรุณาส่ง 'rental_status' มาใน Body ด้วยครับ" 
        });
    }

    try {
        // สเต็ปที่ 1: ดึงข้อมูลบิลมาเช็กก่อน และให้ Database คำนวณวันเกินกำหนด (overdue_days) มาให้เลย
        const getRentalSql = `
            SELECT book_id, due_date, DATEDIFF(NOW(), due_date) AS overdue_days 
            FROM Rentals 
            WHERE rental_id = ? AND deleted_at IS NULL
        `;
        const [rentals] = await dbCon.promise().query(getRentalSql, [rental_id]);

        if (rentals.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบบิลเช่าหมายเลขนี้ในระบบ" });
        }

        const rentalData = rentals[0];
        const book_id = rentalData.book_id;
        const overdue_days = rentalData.overdue_days;

        //  สเต็ปที่ 2: โลจิกกฎเหล็ก! ถ้าไม่ได้กำลังกดคืนหนังสือ และค้างส่งเกิน 30 วัน ➔ บังคับเปลี่ยนเป็น lost ทันที
        if (rental_status !== 'returned' && overdue_days > 30) {
            rental_status = 'lost';
        }

        // สเต็ปที่ 3: โลจิกคิดออโต้ จับคู่ตาราง Rentals ➔ Books
        let autoBookStatus = null;
        switch (rental_status) {
            case 'returned':
                autoBookStatus = 'available'; // คืนแล้ว ➔ ว่าง
                break;
            case 'lost':
                autoBookStatus = 'lost';      // หาย ➔ ล็อกสถานะหาย (ถ้าเกิน 30 วันจะเด้งเข้าเคสนี้ออโต้)
                break;
            case 'overdue':
                autoBookStatus = 'rented';    // ค้างส่งแต่ยังไม่เกิน 30 วัน ➔ ยังนับว่าถูกยืม
                break;
            case 'active':
                autoBookStatus = 'rented';    // กำลังยืม ➔ ถูกยืม
                break;
            default:
                return res.status(400).json({
                    error: true,
                    message: "สถานะ rental_status ไม่ถูกต้อง (ต้องเป็น active, returned, overdue หรือ lost เท่านั้น)"
                });
        }

        // สเต็ปที่ 4: อัปเดตตาราง Rentals
        let updateFields = ["status = ?"];
        let sqlParams = [rental_status];

        if (rental_status === 'returned') {
            updateFields.push("return_date = NOW()"); // ลงเวลาคืนปัจจุบัน
        } else {
            updateFields.push("return_date = NULL");  // ล้างเวลาคืน
        }

        if (new_due_date) {
            updateFields.push("due_date = ?");
            sqlParams.push(new_due_date);
        }

        const returnSql = `UPDATE Rentals SET ${updateFields.join(', ')} WHERE rental_id = ?`;
        sqlParams.push(rental_id);
        await dbCon.promise().query(returnSql, sqlParams);

        // สเต็ปที่ 5: สลับสถานะหนังสือในตาราง Books อัตโนมัติ (รวมไว้ที่เดียวกันแล้ว)
        const updateBookSql = "UPDATE Books SET status = ? WHERE book_id = ?";
        await dbCon.promise().query(updateBookSql, [autoBookStatus, book_id]);

        // จัดเตรียมข้อความแจ้งเตือนหน้าบ้านให้ดูสวยงาม
        let responseMessage = `อัปเดตสำเร็จ! บิล [${rental_status}] ➔ หนังสือ [${autoBookStatus}]`;
        
        // ถ้าถูกแทรกแซงด้วยกฎ 30 วัน ให้แจ้งเตือนบอกแอดมินด้วย
        if (rental_status === 'lost' && overdue_days > 30 && req.body.rental_status !== 'lost') {
            responseMessage += ` (ระบบจะปรับเป็น lost อัตโนมัติ เนื่องจากค้างส่งมาแล้ว ${overdue_days} วัน)`;
        }

        return res.status(200).json({
            error: false,
            message: responseMessage
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 4. [DELETE] ลบหนังสือ (Soft Delete พร้อมระบบดักเช็กสถานะการยืม)
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

// 5. [READ BY ID] ดึงข้อมูลหนังสือรายเล่ม + โชว์ชื่อคนยืมปัจจุบัน
exports.getById = async (req, res) => {
    const book_id = req.params.id; 

    try {
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

        if (books.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบข้อมูลหนังสือเล่มนี้ในระบบ" });
        }

        return res.status(200).json({
            error: false,
            data: books[0] 
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};