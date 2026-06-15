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

        // 💡 เพิ่มคำสั่ง SQL คำนวณส่วนต่างของวัน (DATEDIFF) 
        // ถ้ายืมอยู่ (active) และเลยกำหนดส่งแล้ว -> คำนวณเทียบกับวันปัจจุบัน NOW()
        // ถ้าเป็นสถานะอื่น หรือยังไม่เลยกำหนด -> ให้แสดงผลเป็น 0 วัน
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

// 2. [CREATE] ยืมหนังสือ (เช็กสิทธิ์ทับซ้อน + สกัดเล่มที่หาย/ถูกยืมอยู่)
exports.post = async (req, res) => {
    const { user_id, book_id } = req.body;

    if (!user_id || !book_id) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัสผู้ใช้งานและรหัสหนังสือ" });
    }

    try {
        //  เช็ก 1: ตรวจสอบสถานะหนังสือในคลัง ณ ปัจจุบัน
        const checkBookSql = "SELECT title, status FROM Books WHERE book_id = ? AND deleted_at IS NULL";
        const [books] = await dbCon.promise().query(checkBookSql, [book_id]);

        if (books.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบข้อมูลหนังสือเล่มนี้ในระบบ" });
        }

        //  ดักสกัดเงื่อนไข: ถ้าถูกคนอื่นยืมอยู่ หรือระบบตีเป็นสถานะ lost (หาย) แล้ว ห้ามยืมซ้ำเด็ดขาด!
        if (books[0].status === 'rented') {
            return res.status(409).json({ error: true, message: `หนังสือ '${books[0].title}' ไม่พร้อมให้บริการ เนื่องจากมีคนยืมไปแล้ว` });
        }
        
        if (books[0].status === 'lost') {
            return res.status(409).json({ error: true, message: `ไม่สามารถยืมหนังสือ '${books[0].title}' ได้ เนื่องจากสถานะระบุว่าสูญหาย (เกินกำหนดส่ง 7 วัน)` });
        }

        // 🔍 เช็ก 2: ตรวจสอบว่าตนเองยืมเล่มนี้ค้างไว้แล้วหรือยัง (ต้องยังไม่คืนและบิลยังเปิดอยู่)
        const checkDuplicateSql = "SELECT rental_id FROM Rentals WHERE user_id = ? AND book_id = ? AND status = 'active' AND deleted_at IS NULL";
        const [duplicates] = await dbCon.promise().query(checkDuplicateSql, [user_id, book_id]);

        if (duplicates.length > 0) {
            return res.status(409).json({
                error: true,
                message: `คุณยืมหนังสือ '${books[0].title}' อยู่แล้ว ไม่สามารถยืมซ้ำได้`
            });
        }

        // ✅ บันทึกการยืมลงตาราง Rentals (กำหนดวันคืนอีก 7 วันข้างหน้า)
        const insertRentalSql = `
            INSERT INTO Rentals (user_id, book_id, rent_date, due_date, status)
            VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'active')
        `;
        const [rentalResult] = await dbCon.promise().query(insertRentalSql, [user_id, book_id]);

        // 🔄 อัปเดตสถานะล็อกเล่มหนังสือตัวใหญ่ในคลังให้กลายเป็น 'rented' เพื่อไม่ให้คนอื่นยืมซ้อน
        const updateBookSql = "UPDATE Books SET status = 'rented' WHERE book_id = ?";
        await dbCon.promise().query(updateBookSql, [book_id]);

        return res.status(201).json({
            error: false,
            message: "ยืมหนังสือสำเร็จ กรุณาส่งคืนภายใน 7 วัน",
            rental_id: rentalResult.insertId,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 3. [UPDATE] คืนหนังสือ (อัปเดตบิล + ปลดล็อกหนังสือกลับมาว่าง)
exports.patch = async (req, res) => {
    const rental_id = req.params.id;
    // นอกจาก rental_status แล้ว พี่สามารถส่ง new_due_date มาเพื่อขยายวันกำหนดส่งได้ด้วย (YYYY-MM-DD)
    const { rental_status, new_due_date } = req.body;

    if (!rental_status) {
        return res.status(400).json({ 
            error: true, 
            message: "กรุณาส่ง 'rental_status' มาใน Body ด้วยครับ" 
        });
    }

    //  1. โลจิกคิดออโต้: จับคู่ความสัมพันธ์ของตาราง Rentals ➔ ตาราง Books และจัดการสถานะหนังสือ
    let autoBookStatus = null;
    switch (rental_status) {
        case 'returned':
            autoBookStatus = 'available'; // คืนบิลแล้ว ➔ หนังสือต้องว่างพร้อมยืม
            break;
        case 'lost':
            autoBookStatus = 'lost';      // บิลตีว่าหาย ➔ หนังสือก็ต้องเปลี่ยนเป็นสถานะหาย
            break;
        case 'overdue':
            autoBookStatus = 'rented';    // บิลเกินกำหนดส่ง ➔ หนังสิอยังอยู่กับคนยืม (ติดสเตตัส rented)
            break;
        case 'active':
            autoBookStatus = 'rented';    // บิลกำลังยืมปกติ ➔ หนังสือติดสเตตัส rented
            break;
        default:
            return res.status(400).json({
                error: true,
                message: "สถานะ rental_status ไม่ถูกต้อง (ต้องเป็น active, returned, overdue หรือ lost เท่านั้น)"
            });
    }

    try {
        //  สเต็ปที่ 1: ตรวจสอบบิลเช่าก่อนว่ามีอยู่จริงไหม
        const getRentalSql = "SELECT book_id FROM Rentals WHERE rental_id = ? AND deleted_at IS NULL";
        const [rentals] = await dbCon.promise().query(getRentalSql, [rental_id]);

        if (rentals.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบบิลเช่าหมายเลขนี้ในระบบ" });
        }

        const book_id = rentals[0].book_id;

        //  สเต็ปที่ 2: ไดนามิกคิวรีเพื่ออัปเดตสถานะและวันที่ในตาราง Rentals
        let updateFields = ["status = ?"];
        let sqlParams = [rental_status];

        //  โลจิกจัดการวันที่ล้อตามสเตตัสบิล
        if (rental_status === 'returned') {
            updateFields.push("return_date = NOW()"); // ถ้าคืนสำเร็จ สแตมป์เวลาคืน ณ ตอนนี้
        } else {
            updateFields.push("return_date = NULL");  // ถ้าเป็นสถานะอื่น (เช่น แอดมินกดดึงบิลกลับเป็น overdue) ให้เคลียร์ค่าวันคืนเป็นค่าว่าง
        }

        //  โลจิกพิเศษ: ถ้าหน้าบ้านส่ง 'new_due_date' มาเพื่อขอเลื่อน/ขยายวันส่งคืน
        if (new_due_date) {
            updateFields.push("due_date = ?");
            sqlParams.push(new_due_date);
        }

        // ประกอบคำสั่ง SQL และใส่ rental_id ไว้ท้ายสุด
        const returnSql = `UPDATE Rentals SET ${updateFields.join(', ')} WHERE rental_id = ?`;
        sqlParams.push(rental_id);

        await dbCon.promise().query(returnSql, sqlParams);

        //  สเต็ปที่ 3: สลับสถานะหนังสือในตาราง Books ให้เชื่อมกันโดยอัตโนมัติ
        const updateBookSql = "UPDATE Books SET status = ? WHERE book_id = ?";
        await dbCon.promise().query(updateBookSql, [autoBookStatus, book_id]);

        return res.status(200).json({
            error: false,
            message: `อัปเดตสถานะและวันที่สำเร็จ! บิลเปลี่ยนเป็น [${rental_status}] ➔ หนังสือสลับเป็น [${autoBookStatus}]`
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 4. [DELETE] ลบประวัติการเช่า (Soft Delete ดักแอดมินลบบิลค้างส่ง)
exports.delete = async (req, res) => {
    const rental_id = req.params.id;

    if (!rental_id) {
        return res.status(400).json({ error: true, message: "กรุณาระบุรหัสบิลเช่าที่ต้องการลบ" });
    }

    try {
        //  เช็กป้องกัน: ห้ามลบบิลที่สถานะยังเป็น active อยู่ (ยังไม่คืนหนังสือ)
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

        // มั่นใจแล้วว่าคืนแล้ว ค่อยสั่ง Soft Delete
        const deleteSql = "UPDATE Rentals SET deleted_at = NOW() WHERE rental_id = ? AND deleted_at IS NULL";
        await dbCon.promise().query(deleteSql, [rental_id]);

        return res.status(200).json({ error: false, message: "ลบประวัติการเช่าเรียบร้อยแล้ว" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};