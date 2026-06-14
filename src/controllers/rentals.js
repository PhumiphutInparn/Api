const dbCon = require("../config/db");
const finesController = require("./fines");

// 1. [READ] ดึงข้อมูลประวัติการเช่าทั้งหมด + ค้นหา + แบ่งหน้า
exports.get = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const offset = (page - 1) * limit;

    // รองรับการกรองตามรหัสบิล, รหัสคนยืม, รหัสหนังสือ หรือสถานะบิล ('active', 'returned')
    const { rental_id, user_id, book_id, status } = req.query;

    try {
        let filterSql = " WHERE r.deleted_at IS NULL";
        let queryParams = [];

        if (rental_id) { filterSql += " AND r.rental_id = ?"; queryParams.push(rental_id); }
        if (user_id) { filterSql += " AND r.user_id = ?"; queryParams.push(user_id); }
        if (book_id) { filterSql += " AND r.book_id = ?"; queryParams.push(book_id); }
        if (status) { filterSql += " AND r.status = ?"; queryParams.push(status); }

        const countSql = `SELECT COUNT(*) AS total FROM Rentals r ${filterSql}`;
        const [countResult] = await dbCon.promise().query(countSql, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // ดึงข้อมูลการเช่า พร้อม JOIN ชื่อคนและชื่อหนังสือมาแสดงผลด้วย
        const dataSql = `
            SELECT r.rental_id, r.rent_date, r.due_date, r.return_date, r.status,
                   u.user_id, u.first_name, u.last_name, u.email,
                   b.book_id, b.title, b.isbn
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

// 2. [CREATE] ยืมหนังสือ (เช็กสิทธิ์ทับซ้อน + อัปเดตสถานะหนังสือ + check user status)
exports.post = async (req, res) => {
    const { user_id, book_id } = req.body;

    if (!user_id || !book_id) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัสผู้ใช้งานและรหัสหนังสือ" });
    }

    try {
        // ✅ เช็ก 1: ตรวจสอบสถานะผู้ใช้งาน (มี fine ค้างหรือ overdue books หรือไม่)
        const userStatus = await finesController.checkUserStatus(user_id);

        if (userStatus.hasIssue) {
            let reason = [];
            if (userStatus.hasUnpaidFines) reason.push("ค่าปรับค้างชำระ");
            if (userStatus.hasOverdueBooks) reason.push("มีหนังสือเกินกำหนด");

            return res.status(409).json({
                error: true,
                message: `ไม่สามารถยืมหนังสือได้ เนื่องจาก: ${reason.join(" และ ")}`
            });
        }

        // ✅ เช็ก 2: ตรวจสอบสถานะหนังสือ
        const checkBookSql = "SELECT title, status FROM Books WHERE book_id = ? AND deleted_at IS NULL";
        const [books] = await dbCon.promise().query(checkBookSql, [book_id]);

        if (books.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบข้อมูลหนังสือเล่มนี้ในระบบ" });
        }

        if (books[0].status !== 'available') {
            return res.status(409).json({
                error: true,
                message: `หนังสือ '${books[0].title}' ไม่พร้อมให้บริการ (ติดสถานะ: ${books[0].status})`
            });
        }

        // ✅ เช็ก 3: ตรวจสอบว่า user มีหนังสือเล่มนี้ยืมอยู่แล้วหรือไม่
        const checkDuplicateSql = "SELECT rental_id FROM Rentals WHERE user_id = ? AND book_id = ? AND status = 'active' AND deleted_at IS NULL";
        const [duplicates] = await dbCon.promise().query(checkDuplicateSql, [user_id, book_id]);

        if (duplicates.length > 0) {
            return res.status(409).json({
                error: true,
                message: `คุณยืมหนังสือ '${books[0].title}' อยู่แล้ว ไม่สามารถยืมซ้ำได้`
            });
        }

        // บันทึกการยืมลงตาราง Rentals (กำหนดวันคืนอีก 7 วันข้างหน้า)
        const insertRentalSql = `
            INSERT INTO Rentals (user_id, book_id, rent_date, due_date, status)
            VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'active')
        `;
        const [rentalResult] = await dbCon.promise().query(insertRentalSql, [user_id, book_id]);

        //   อัปเดตสถานะหนังสือเป็น 'rented' เพื่อไม่ให้คนอื่นมายืมซ้ำ
        const updateBookSql = "UPDATE Books SET status = 'rented' WHERE book_id = ?";
        await dbCon.promise().query(updateBookSql, [book_id]);

        return res.status(201).json({
            error: false,
            message: "ยืมหนังสือสำเร็จ",
            rental_id: rentalResult.insertId,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 3. [UPDATE] คืนหนังสือ (อัปเดตบิล + ปลดล็อกหนังสือ)
exports.patch = async (req, res) => {
    const rental_id = req.params.id;

    try {
        // 🔍 สเต็ปที่ 1: ดึงข้อมูลบิลเช่าออกมาก่อน เพื่อหาว่ายืมหนังสือเล่มไหนไป
        const getRentalSql = "SELECT book_id, status FROM Rentals WHERE rental_id = ? AND deleted_at IS NULL";
        const [rentals] = await dbCon.promise().query(getRentalSql, [rental_id]);

        if (rentals.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบบิลเช่าหมายเลขนี้ในระบบ" });
        }

        if (rentals[0].status === 'returned') {
            return res.status(400).json({ error: true, message: "บิลเช่านี้ถูกทำรายการคืนไปแล้ว" });
        }

        const book_id = rentals[0].book_id;

        // 📝 สเต็ปที่ 2: อัปเดตบิลเช่าให้สถานะเป็น 'returned' และสแตมป์เวลาปัจจุบันลงใน return_date
        const returnSql = "UPDATE Rentals SET status = 'returned', return_date = NOW() WHERE rental_id = ?";
        await dbCon.promise().query(returnSql, [rental_id]);

        // 🔓 สเต็ปที่ 3: ปลดล็อกหนังสือให้กลับมา 'available' เพื่อให้คนอื่นยืมต่อได้
        const freeBookSql = "UPDATE Books SET status = 'available' WHERE book_id = ?";
        await dbCon.promise().query(freeBookSql, [book_id]);

        return res.status(200).json({
            error: false,
            message: "ทำรายการคืนหนังสือสำเร็จ ระบบได้ปลดล็อกหนังสือให้พร้อมยืมแล้ว"
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 4. [DELETE] ลบประวัติการเช่า (Soft Delete)
exports.delete = async (req, res) => {
    const rental_id = req.params.id;

    if (!rental_id) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัสบิลเช่าที่ต้องการลบ" });
    }

    try {
        // 🛡️ เช็กป้องกัน: ห้ามลบบิลที่ยังไม่ได้คืนหนังสือ (กันแอดมินลบประวัติหนี)
        const checkSql = "SELECT status FROM Rentals WHERE rental_id = ? AND deleted_at IS NULL";
        const [rentals] = await dbCon.promise().query(checkSql, [rental_id]);

        if (rentals.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบบิลเช่านี้ในระบบ" });
        }

        if (rentals[0].status === 'active') {
            return res.status(409).json({ 
                error: true, 
                message: "ไม่สามารถลบประวัติได้เนื่องจากบิลนี้ยังไม่มีการคืนหนังสือ (สถานะ active)" 
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