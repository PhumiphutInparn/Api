const dbCon = require("../config/db");

const updateBookStatuses = async () => {
    try {
        await dbCon.promise().query(
            "UPDATE rentals SET status = 'overdue' WHERE status = 'active' AND NOW() > due_date AND return_date IS NULL"
        );
        await dbCon.promise().query(
            "UPDATE books b JOIN rentals r ON b.book_id = r.book_id SET b.status = 'lost' WHERE r.status = 'overdue' AND NOW() > DATE_ADD(r.due_date, INTERVAL 30 DAY) AND r.return_date IS NULL"
        );
    } catch (err) {
        console.error(err);
    }
};

exports.get = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    let { rental_id, user_id, book_id, status, search } = req.query;

    if (req.user.role !== 'admin') {
        user_id = req.user.user_id;
    }

    try {
        await updateBookStatuses();

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
            FROM rentals r
            INNER JOIN users u ON r.user_id = u.user_id
            INNER JOIN books b ON r.book_id = b.book_id
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
            FROM rentals r
            INNER JOIN users u ON r.user_id = u.user_id
            INNER JOIN books b ON r.book_id = b.book_id
            ${filterSql}
            ORDER BY r.rental_id DESC
            LIMIT ? OFFSET ?
        `;
        
        const finalParams = [...queryParams, limit, offset];
        const [rows] = await dbCon.promise().query(dataSql, finalParams);

        return res.status(200).json({
            error: false,
            data: rows,
            pagination: { current_page: page, per_page: limit, total_items: totalItems, total_pages: totalPages }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

exports.borrowBook = async (req, res) => {
    const { book_id } = req.body;
    const user_id = req.user.user_id;

    try {
        const [books] = await dbCon.promise().query("SELECT status FROM books WHERE book_id = ?", [book_id]);
        if (books.length === 0) return res.status(404).json({ error: true, message: "ไม่พบข้อมูลหนังสือ" });
        if (books[0].status !== 'available') return res.status(409).json({ error: true, message: "หนังสือเล่มนี้ติดสถานะยืมอยู่ ไม่สามารถยืมได้" });

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        await dbCon.promise().query("START TRANSACTION");

        const insertRentalSql = "INSERT INTO rentals (user_id, book_id, status, due_date) VALUES (?, ?, 'active', ?)";
        await dbCon.promise().query(insertRentalSql, [user_id, book_id, dueDate]);
        
        await dbCon.promise().query("UPDATE books SET status = 'rented' WHERE book_id = ?", [book_id]);

        await dbCon.promise().query("COMMIT");

        return res.status(201).json({ error: false, message: "ยืมหนังสือสำเร็จ ระบบกำหนดส่งคืนภายใน 7 วัน" });
    } catch (error) {
        await dbCon.promise().query("ROLLBACK");
        console.log(error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

exports.patch = async (req, res) => {
    const rental_id = req.params.id;
    const { rental_status, new_due_date } = req.body;

    if (!rental_status) return res.status(400).json({ error: true, message: "กรุณาส่ง rental_status มาด้วย" });

    let autoBookStatus = null;
    switch (rental_status) {
        case 'returned': autoBookStatus = 'available'; break;
        case 'lost': autoBookStatus = 'lost'; break;
        case 'overdue': autoBookStatus = 'rented'; break;
        case 'active': autoBookStatus = 'rented'; break;
        default:
            return res.status(400).json({ error: true, message: "สถานะ rental_status ไม่ถูกต้อง" });
    }

    try {
        const getRentalSql = "SELECT book_id FROM rentals WHERE rental_id = ? AND deleted_at IS NULL";
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

        const returnSql = `UPDATE rentals SET ${updateFields.join(', ')} WHERE rental_id = ?`;
        sqlParams.push(rental_id);

        await dbCon.promise().query("START TRANSACTION");
        
        await dbCon.promise().query(returnSql, sqlParams);
        await dbCon.promise().query("UPDATE books SET status = ? WHERE book_id = ?", [autoBookStatus, book_id]);
        
        await dbCon.promise().query("COMMIT");

        return res.status(200).json({ error: false, message: "อัปเดตสถานะสำเร็จ" });
    } catch (err) {
        await dbCon.promise().query("ROLLBACK");
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

exports.delete = async (req, res) => {
    const rental_id = req.params.id;
    if (!rental_id) return res.status(400).json({ error: true, message: "กรุณาระบุรหัสบิลเช่าที่ต้องการลบ" });

    try {
        const checkSql = "SELECT status FROM rentals WHERE rental_id = ? AND deleted_at IS NULL";
        const [rentals] = await dbCon.promise().query(checkSql, [rental_id]);
        if (rentals.length === 0) return res.status(404).json({ error: true, message: "ไม่พบบิลเช่านี้ในระบบ" });
        if (rentals[0].status === 'active') {
            return res.status(409).json({ error: true, message: "ไม่สามารถลบประวัติได้เนื่องจากหนังสือยังไม่ถูกส่งคืน" });
        }

        const deleteSql = "UPDATE rentals SET deleted_at = NOW() WHERE rental_id = ? AND deleted_at IS NULL";
        await dbCon.promise().query(deleteSql, [rental_id]);

        return res.status(200).json({ error: false, message: "ลบประวัติการเช่าเรียบร้อยแล้ว" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};