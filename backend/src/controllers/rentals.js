const dbCon = require("../config/db");

// 1. [READ] ดึงข้อมูลประวัติการเช่าทั้งหมด + ค้นหา + แบ่งหน้า + คำนวณวันเกินกำหนด (Overdue Days)
exports.get = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const offset = (page - 1) * limit;

    const { rental_id, user_id, book_id, status, search } = req.query;

    try {
        let filterSql = " WHERE r.deleted_at IS NULL";
        let queryParams = [];

        if (rental_id) { filterSql += " AND r.rental_id = ?"; queryParams.push(rental_id); }
        if (user_id) { filterSql += " AND r.user_id = ?"; queryParams.push(user_id); }
        if (book_id) { filterSql += " AND r.book_id = ?"; queryParams.push(book_id); }
        if (status) { filterSql += " AND r.status = ?"; queryParams.push(status); }

        if (search) {
            filterSql += " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR b.title LIKE ?)";
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        const countSql = `
            SELECT COUNT(*) AS total 
            FROM Rentals r
            INNER JOIN Users u ON r.user_id = u.user_id
            INNER JOIN Books b ON r.book_id = b.book_id
            ${filterSql}
        `;
        const [countResult] = await dbCon.promise().query(countSql, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const dataSql = `
            SELECT r.rental_id, r.rent_date, r.due_date, r.return_date, r.status,
                   u.user_id, u.first_name, u.last_name, u.email,
                   b.book_id, b.title, b.isbn,
                   CASE 
                       WHEN r.status = 'active' AND NOW() > r.due_date THEN DATEDIFF(NOW(), r.due_date)
                       ELSE 0 
                   END AS overdue_days
            FROM Rentals r
            INNER JOIN Users u ON r.user_id = u.user_id
            INNER JOIN Books b ON r.book_id = b.book_id
            ${filterSql}
            ORDER BY r.rental_id DESC
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

// 2. [CREATE: Member] ส่งคำขอยืมหนังสือ (สถานะจะกลายเป็น Pending)
exports.requestRental = async (req, res) => {
    // รับ due_date ที่ User เลือกมาจากหน้าบ้าน (ต้องส่งเป็น 'YYYY-MM-DD')
    const { book_id, due_date } = req.body; 
    const user_id = req.user.user_id;

    if (!book_id || !due_date) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัสหนังสือ และวันที่ต้องการคืน" });
    }

    try {
        // เช็กสถานะหนังสือ...
        const checkBookSql = "SELECT title, status FROM Books WHERE book_id = ? AND deleted_at IS NULL";
        const [books] = await dbCon.promise().query(checkBookSql, [book_id]);

        if (books.length === 0) return res.status(404).json({ error: true, message: "ไม่พบข้อมูลหนังสือ" });
        if (books[0].status === 'rented') return res.status(409).json({ error: true, message: `ถูกยืมไปแล้ว` });
        if (books[0].status === 'pending') return res.status(409).json({ error: true, message: `มีคนกำลังขอยืมอยู่` });
        if (books[0].status === 'lost') return res.status(409).json({ error: true, message: `หนังสือสูญหาย` });

        const checkDuplicateSql = "SELECT rental_id FROM Rentals WHERE user_id = ? AND book_id = ? AND status IN ('active', 'pending') AND deleted_at IS NULL";
        const [duplicates] = await dbCon.promise().query(checkDuplicateSql, [user_id, book_id]);

        if (duplicates.length > 0) return res.status(409).json({ error: true, message: `คุณขอยืมเล่มนี้อยู่แล้ว` });

        await dbCon.promise().query("START TRANSACTION");

        // ยัด due_date ที่ User เลือก ลงในบิลตั้งแต่ตอนสร้างเลย
        const insertRentalSql = "INSERT INTO Rentals (user_id, book_id, status, due_date) VALUES (?, ?, 'pending', ?)";
        const [rentalResult] = await dbCon.promise().query(insertRentalSql, [user_id, book_id, due_date]);
        
        const updateBookSql = "UPDATE Books SET status = 'pending' WHERE book_id = ?";
        await dbCon.promise().query(updateBookSql, [book_id]);

        await dbCon.promise().query("COMMIT");

        return res.status(201).json({ 
            error: false, 
            message: "ส่งคำร้องสำเร็จ กรุณาติดต่อแอดมินเพื่อรับหนังสือ",
            rental_id: rentalResult.insertId
        });

    } catch (error) {
        await dbCon.promise().query("ROLLBACK");
        console.log(error);
        return res.status(500).json({ error: true, message: "ระบบขัดข้อง" });
    }
};

// 3. [UPDATE: Admin] แอดมินกดยืนยันการยืม (Pending -> Active)
exports.approveRental = async (req, res) => {
    const { rental_id } = req.params;

    try {
        const [rental] = await dbCon.promise().query("SELECT book_id, status FROM Rentals WHERE rental_id = ?", [rental_id]);
        
        if (rental.length === 0) return res.status(404).json({ error: true, message: "ไม่พบข้อมูลคำร้อง" });
        if (rental[0].status !== 'pending') return res.status(400).json({ error: true, message: "คำร้องนี้ไม่ได้อยู่ในสถานะรออนุมัติ" });

        const book_id = rental[0].book_id;

        await dbCon.promise().query("START TRANSACTION");

        // อัปเดต Rental เป็น active เริ่มนับวันยืม 7 วันนับจากตอนนี้
        const updateRentalSql = `
            UPDATE Rentals SET status = 'active', rent_date = NOW(), due_date = DATE_ADD(NOW(), INTERVAL 7 DAY) 
            WHERE rental_id = ?
        `;
        await dbCon.promise().query(updateRentalSql, [rental_id]);

        // อัปเดต หนังสือเป็น rented
        const updateBookSql = "UPDATE Books SET status = 'rented' WHERE book_id = ?";
        await dbCon.promise().query(updateBookSql, [book_id]);

        await dbCon.promise().query("COMMIT");

        return res.status(200).json({ 
            error: false, 
            message: "อนุมัติการยืมเรียบร้อย ระบบเริ่มนับวันทำรายการแล้ว" 
        });

    } catch (error) {
        await dbCon.promise().query("ROLLBACK");
        console.log(error);
        return res.status(500).json({ error: true, message: "ระบบขัดข้อง" });
    }
};

// 4. [UPDATE: Admin] คืนหนังสือ / ปรับสถานะบิล (อัปเดตบิล + ปลดล็อกหนังสือ)
exports.patch = async (req, res) => {
    const rental_id = req.params.id;
    const { rental_status, new_due_date } = req.body;

    if (!rental_status) return res.status(400).json({ error: true, message: "กรุณาส่ง 'rental_status' มาใน Body ด้วยครับ" });

    // โลจิกคิดออโต้: จัดการสถานะหนังสือ
    let autoBookStatus = null;
    switch (rental_status) {
        case 'returned': autoBookStatus = 'available'; break;
        case 'lost': autoBookStatus = 'lost'; break;
        case 'overdue': autoBookStatus = 'rented'; break;
        case 'active': autoBookStatus = 'rented'; break;
        case 'pending': autoBookStatus = 'pending'; break;
        default:
            return res.status(400).json({ error: true, message: "สถานะ rental_status ไม่ถูกต้อง" });
    }

    try {
        const getRentalSql = "SELECT book_id FROM Rentals WHERE rental_id = ? AND deleted_at IS NULL";
        const [rentals] = await dbCon.promise().query(getRentalSql, [rental_id]);

        if (rentals.length === 0) return res.status(404).json({ error: true, message: "ไม่พบบิลเช่าหมายเลขนี้ในระบบ" });

        const book_id = rentals[0].book_id;
        let updateFields = ["status = ?"];
        let sqlParams = [rental_status];

        if (rental_status === 'returned') {
            updateFields.push("return_date = NOW()"); 
        } else {
            updateFields.push("return_date = NULL");  
        }

        if (new_due_date) {
            updateFields.push("due_date = ?");
            sqlParams.push(new_due_date);
        }

        const returnSql = `UPDATE Rentals SET ${updateFields.join(', ')} WHERE rental_id = ?`;
        sqlParams.push(rental_id);

        await dbCon.promise().query("START TRANSACTION");
        
        await dbCon.promise().query(returnSql, sqlParams);
        await dbCon.promise().query("UPDATE Books SET status = ? WHERE book_id = ?", [autoBookStatus, book_id]);
        
        await dbCon.promise().query("COMMIT");

        return res.status(200).json({
            error: false,
            message: `อัปเดตสถานะสำเร็จ! บิลเปลี่ยนเป็น [${rental_status}] ➔ หนังสือสลับเป็น [${autoBookStatus}]`
        });

    } catch (err) {
        await dbCon.promise().query("ROLLBACK");
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 5. [DELETE] ลบประวัติการเช่า (Soft Delete)
exports.delete = async (req, res) => {
    const rental_id = req.params.id;

    if (!rental_id) return res.status(400).json({ error: true, message: "กรุณาระบุรหัสบิลเช่าที่ต้องการลบ" });

    try {
        const checkSql = "SELECT status FROM Rentals WHERE rental_id = ? AND deleted_at IS NULL";
        const [rentals] = await dbCon.promise().query(checkSql, [rental_id]);

        if (rentals.length === 0) return res.status(404).json({ error: true, message: "ไม่พบบิลเช่านี้ในระบบ" });
        if (rentals[0].status === 'active' || rentals[0].status === 'pending') {
            return res.status(409).json({ 
                error: true, 
                message: `ไม่สามารถลบประวัติได้เนื่องจากบิลนี้อยู่ในสถานะ ${rentals[0].status}` 
            });
        }

        const deleteSql = "UPDATE Rentals SET deleted_at = NOW() WHERE rental_id = ? AND deleted_at IS NULL";
        await dbCon.promise().query(deleteSql, [rental_id]);

        return res.status(200).json({ error: false, message: "ลบประวัติการเช่าเรียบร้อยแล้ว" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};