const dbCon = require("../config/db");

// 🔍 [HELPER] ตรวจสอบสถานะผู้ใช้งาน (มี fine หรือมี overdue books หรือไม่)
exports.checkUserStatus = async (user_id) => {
    try {
        // เช็กว่ามี fine ที่ยังไม่จ่าย
        const [unpaidFines] = await dbCon.promise().query(
            "SELECT COUNT(*) as count FROM Fines WHERE user_id = ? AND is_paid = FALSE AND deleted_at IS NULL",
            [user_id]
        );

        // เช็กว่ามี rental ที่ active และ overdue แล้ว
        const [overdueRentals] = await dbCon.promise().query(
            "SELECT COUNT(*) as count FROM Rentals WHERE user_id = ? AND status = 'active' AND due_date < NOW() AND deleted_at IS NULL",
            [user_id]
        );

        const hasUnpaidFines = unpaidFines[0].count > 0;
        const hasOverdueBooks = overdueRentals[0].count > 0;

        return {
            hasIssue: hasUnpaidFines || hasOverdueBooks,
            hasUnpaidFines,
            hasOverdueBooks
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
};

// 📋 [READ] ดึงข้อมูล fines ทั้งหมด + pagination + filter
exports.get = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { user_id, is_paid } = req.query;

    try {
        let filterSql = " WHERE f.deleted_at IS NULL";
        let queryParams = [];

        if (user_id) {
            filterSql += " AND f.user_id = ?";
            queryParams.push(user_id);
        }

        if (is_paid !== undefined) {
            filterSql += " AND f.is_paid = ?";
            queryParams.push(is_paid === 'true' ? 1 : 0);
        }

        const countSql = `SELECT COUNT(*) AS total FROM Fines f ${filterSql}`;
        const [countResult] = await dbCon.promise().query(countSql, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const dataSql = `
            SELECT f.fine_id, f.user_id, f.rental_id, f.book_id, f.fine_amount,
                   f.fine_reason, f.is_paid, f.created_at, f.paid_at,
                   u.first_name, u.last_name, b.title
            FROM Fines f
            LEFT JOIN Users u ON f.user_id = u.user_id
            LEFT JOIN Books b ON f.book_id = b.book_id
            ${filterSql}
            ORDER BY f.created_at DESC
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

// 💰 [UPDATE] จ่ายค่าปรับ (Mark as Paid)
exports.payFine = async (req, res) => {
    const fine_id = req.params.id;

    try {
        // ดึงข้อมูล fine ก่อน
        const [fines] = await dbCon.promise().query(
            "SELECT user_id, fine_amount FROM Fines WHERE fine_id = ? AND deleted_at IS NULL",
            [fine_id]
        );

        if (fines.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบข้อมูลค่าปรับนี้ในระบบ" });
        }

        if (fines[0].is_paid) {
            return res.status(400).json({ error: true, message: "ค่าปรับนี้จ่ายแล้ว" });
        }

        const user_id = fines[0].user_id;
        const fine_amount = fines[0].fine_amount;

        // อัปเดต fine เป็น paid
        await dbCon.promise().query(
            "UPDATE Fines SET is_paid = TRUE, paid_at = NOW() WHERE fine_id = ?",
            [fine_id]
        );

        // อัปเดต total unpaid fines ของ user
        const [remainingFines] = await dbCon.promise().query(
            "SELECT COALESCE(SUM(fine_amount), 0) as total FROM Fines WHERE user_id = ? AND is_paid = FALSE AND deleted_at IS NULL",
            [user_id]
        );

        await dbCon.promise().query(
            "UPDATE Users SET total_unpaid_fines = ? WHERE user_id = ?",
            [remainingFines[0].total, user_id]
        );

        // ถ้าไม่มี fine ค้างแล้ว ให้เปลี่ยน status เป็น active
        if (remainingFines[0].total === 0) {
            // ตรวจสอบว่ามี overdue books ไหม
            const [overdueBooks] = await dbCon.promise().query(
                "SELECT COUNT(*) as count FROM Rentals WHERE user_id = ? AND status = 'active' AND due_date < NOW() AND deleted_at IS NULL",
                [user_id]
            );

            if (overdueBooks[0].count === 0) {
                await dbCon.promise().query(
                    "UPDATE Users SET user_status = 'active' WHERE user_id = ?",
                    [user_id]
                );
            }
        }

        return res.status(200).json({ error: false, message: "จ่ายค่าปรับสำเร็จแล้ว" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// ⚠️ [CRON JOB] ตรวจสอบหนังสือที่ overdue 7 วัน และสร้าง fine (ควรเรียกใช้ทุกวัน)
exports.processOverdueBooks = async (req, res) => {
    try {
        // ดึง rental ที่ overdue แล้ว แต่ยังไม่ได้ mark as lost
        const [overdueRentals] = await dbCon.promise().query(`
            SELECT r.rental_id, r.user_id, r.book_id, r.due_date, r.status
            FROM Rentals r
            WHERE r.status = 'active'
            AND DATE_ADD(r.due_date, INTERVAL 7 DAY) <= NOW()
            AND r.deleted_at IS NULL
        `);

        if (overdueRentals.length === 0) {
            return res.status(200).json({ error: false, message: "ไม่มีหนังสือที่ overdue" });
        }

        let processedCount = 0;
        let fineAmount = 50; // ค่าปรับต่อวันละ 50 บาท

        for (const rental of overdueRentals) {
            // คำนวณวันที่ overdue
            const daysOverdue = Math.floor(
                (new Date() - new Date(rental.due_date)) / (1000 * 60 * 60 * 24)
            );

            // คำนวณค่าปรับ (สูงสุด 500 บาท)
            const totalFine = Math.min(fineAmount * daysOverdue, 500);

            try {
                // สร้าง fine record
                await dbCon.promise().query(`
                    INSERT INTO Fines (user_id, rental_id, book_id, fine_amount, fine_reason)
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    rental.user_id,
                    rental.rental_id,
                    rental.book_id,
                    totalFine,
                    `หนังสือเกินกำหนด ${daysOverdue} วัน`
                ]);

                // อัปเดต rental เป็น overdue
                await dbCon.promise().query(
                    "UPDATE Rentals SET is_overdue = TRUE, fine_amount = ? WHERE rental_id = ?",
                    [totalFine, rental.rental_id]
                );

                // อัปเดต Books status เป็น 'lost'
                await dbCon.promise().query(
                    "UPDATE Books SET status = 'lost', marked_lost_date = NOW() WHERE book_id = ?",
                    [rental.book_id]
                );

                // อัปเดต Users status เป็น 'suspended' และ total_unpaid_fines
                const [currentUser] = await dbCon.promise().query(
                    "SELECT total_unpaid_fines FROM Users WHERE user_id = ?",
                    [rental.user_id]
                );

                const newTotal = (currentUser[0].total_unpaid_fines || 0) + totalFine;
                await dbCon.promise().query(
                    "UPDATE Users SET user_status = 'suspended', total_unpaid_fines = ? WHERE user_id = ?",
                    [newTotal, rental.user_id]
                );

                processedCount++;
            } catch (err) {
                console.log(`Error processing rental ${rental.rental_id}:`, err);
            }
        }

        return res.status(200).json({
            error: false,
            message: `ประมวลผลสำเร็จ ${processedCount} รายการ`,
            processed_count: processedCount
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 📊 [READ] ดูข้อมูล fine ของ user ที่ระบุ
exports.getUserFines = async (req, res) => {
    const user_id = req.params.user_id;

    try {
        const [fines] = await dbCon.promise().query(`
            SELECT f.fine_id, f.fine_amount, f.fine_reason, f.is_paid,
                   f.created_at, f.paid_at, b.title
            FROM Fines f
            LEFT JOIN Books b ON f.book_id = b.book_id
            WHERE f.user_id = ? AND f.deleted_at IS NULL
            ORDER BY f.created_at DESC
        `, [user_id]);

        const [userStatus] = await dbCon.promise().query(
            "SELECT user_status, total_unpaid_fines FROM Users WHERE user_id = ?",
            [user_id]
        );

        if (userStatus.length === 0) {
            return res.status(404).json({ error: true, message: "ไม่พบผู้ใช้งานนี้" });
        }

        return res.status(200).json({
            error: false,
            user_status: userStatus[0].user_status,
            total_unpaid_fines: userStatus[0].total_unpaid_fines,
            fines: fines
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};
