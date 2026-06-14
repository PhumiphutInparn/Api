const dbCon = require("../config/db");
const bcrypt = require("bcrypt");

// 1️⃣ [BULK] เพิ่มผู้ใช้หลายคนพร้อมกัน
exports.bulkCreateUsers = async (req, res) => {
    const { users } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
            error: true,
            message: "กรุณาส่ง array 'users' ที่มีอย่างน้อย 1 รายการ"
        });
    }

    try {
        let successCount = 0;
        let failureCount = 0;
        const failedUsers = [];

        for (const user of users) {
            const { email, password, first_name, last_name, role } = user;

            // Validate required fields
            if (!email || !password || !first_name) {
                failedUsers.push({
                    email,
                    error: "missing_fields",
                    message: "ต้องมี email, password, first_name"
                });
                failureCount++;
                continue;
            }

            try {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const validRole = (role && ['admin', 'member'].includes(role)) ? role : 'member';

                const sql = "INSERT INTO Users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)";
                await dbCon.promise().query(sql, [email, hashedPassword, first_name, last_name || '', validRole]);

                successCount++;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    failedUsers.push({
                        email,
                        error: "duplicate_email",
                        message: "อีเมลนี้ถูกใช้งานแล้ว"
                    });
                } else {
                    failedUsers.push({
                        email,
                        error: "database_error",
                        message: err.message
                    });
                }
                failureCount++;
            }
        }

        return res.status(201).json({
            error: false,
            message: `เพิ่มผู้ใช้สำเร็จ ${successCount} คน (ล้มเหลว ${failureCount} คน)`,
            summary: {
                total: users.length,
                success: successCount,
                failure: failureCount
            },
            failed_users: failedUsers.length > 0 ? failedUsers : undefined
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 2️⃣ [BULK] เพิ่มหนังสือหลายเล่มพร้อมกัน
exports.bulkCreateBooks = async (req, res) => {
    const { books } = req.body;

    if (!books || !Array.isArray(books) || books.length === 0) {
        return res.status(400).json({
            error: true,
            message: "กรุณาส่ง array 'books' ที่มีอย่างน้อย 1 เล่ม"
        });
    }

    try {
        let successCount = 0;
        let failureCount = 0;
        const failedBooks = [];

        for (const book of books) {
            const { title, author, isbn, status } = book;

            if (!title || !author || !isbn) {
                failedBooks.push({
                    title,
                    isbn,
                    error: "missing_fields",
                    message: "ต้องมี title, author, isbn"
                });
                failureCount++;
                continue;
            }

            try {
                const sql = "INSERT INTO Books (title, author, isbn, status) VALUES (?, ?, ?, ?)";
                await dbCon.promise().query(sql, [title, author, isbn, status || 'available']);

                successCount++;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    failedBooks.push({
                        title,
                        isbn,
                        error: "duplicate_isbn",
                        message: "ISBN นี้มีอยู่ในระบบแล้ว"
                    });
                } else {
                    failedBooks.push({
                        title,
                        isbn,
                        error: "database_error",
                        message: err.message
                    });
                }
                failureCount++;
            }
        }

        return res.status(201).json({
            error: false,
            message: `เพิ่มหนังสือสำเร็จ ${successCount} เล่ม (ล้มเหลว ${failureCount} เล่ม)`,
            summary: {
                total: books.length,
                success: successCount,
                failure: failureCount
            },
            failed_books: failedBooks.length > 0 ? failedBooks : undefined
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 3️⃣ [BULK] เพิ่มการยืมหลายรายการพร้อมกัน
exports.bulkCreateRentals = async (req, res) => {
    const { rentals } = req.body;

    if (!rentals || !Array.isArray(rentals) || rentals.length === 0) {
        return res.status(400).json({
            error: true,
            message: "กรุณาส่ง array 'rentals' ที่มีอย่างน้อย 1 รายการ"
        });
    }

    const finesController = require('./fines');

    try {
        let successCount = 0;
        let failureCount = 0;
        const failedRentals = [];

        for (const rental of rentals) {
            const { user_id, book_id } = rental;

            if (!user_id || !book_id) {
                failedRentals.push({
                    user_id,
                    book_id,
                    error: "missing_fields",
                    message: "ต้องมี user_id, book_id"
                });
                failureCount++;
                continue;
            }

            try {
                // เช็ก user status
                const userStatus = await finesController.checkUserStatus(user_id);
                if (userStatus.hasIssue) {
                    const reason = [];
                    if (userStatus.hasUnpaidFines) reason.push("มี fine ค้าง");
                    if (userStatus.hasOverdueBooks) reason.push("มี overdue books");

                    failedRentals.push({
                        user_id,
                        book_id,
                        error: "user_status_issue",
                        message: `ผู้ใช้มีปัญหา: ${reason.join(", ")}`
                    });
                    failureCount++;
                    continue;
                }

                // เช็กหนังสือ
                const [books] = await dbCon.promise().query(
                    "SELECT title, status FROM Books WHERE book_id = ? AND deleted_at IS NULL",
                    [book_id]
                );

                if (books.length === 0) {
                    failedRentals.push({
                        user_id,
                        book_id,
                        error: "book_not_found",
                        message: "ไม่พบหนังสือ"
                    });
                    failureCount++;
                    continue;
                }

                if (books[0].status !== 'available') {
                    failedRentals.push({
                        user_id,
                        book_id,
                        error: "book_not_available",
                        message: `หนังสือ '${books[0].title}' ไม่พร้อม (${books[0].status})`
                    });
                    failureCount++;
                    continue;
                }

                // เช็ก duplicate
                const [duplicates] = await dbCon.promise().query(
                    "SELECT rental_id FROM Rentals WHERE user_id = ? AND book_id = ? AND status = 'active' AND deleted_at IS NULL",
                    [user_id, book_id]
                );

                if (duplicates.length > 0) {
                    failedRentals.push({
                        user_id,
                        book_id,
                        error: "duplicate_rental",
                        message: "ผู้ใช้ยืมหนังสือนี้อยู่แล้ว"
                    });
                    failureCount++;
                    continue;
                }

                // สร้างการยืม
                const insertRentalSql = `
                    INSERT INTO Rentals (user_id, book_id, rent_date, due_date, status)
                    VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'active')
                `;
                const [rentalResult] = await dbCon.promise().query(insertRentalSql, [user_id, book_id]);

                // อัปเดตสถานะหนังสือ
                await dbCon.promise().query(
                    "UPDATE Books SET status = 'rented' WHERE book_id = ?",
                    [book_id]
                );

                successCount++;
            } catch (err) {
                failedRentals.push({
                    user_id,
                    book_id,
                    error: "database_error",
                    message: err.message
                });
                failureCount++;
            }
        }

        return res.status(201).json({
            error: false,
            message: `เพิ่มการยืมสำเร็จ ${successCount} รายการ (ล้มเหลว ${failureCount} รายการ)`,
            summary: {
                total: rentals.length,
                success: successCount,
                failure: failureCount
            },
            failed_rentals: failedRentals.length > 0 ? failedRentals : undefined
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 4️⃣ [BULK] Delete users หลายคนพร้อมกัน
exports.bulkDeleteUsers = async (req, res) => {
    const { user_ids } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
            error: true,
            message: "กรุณาส่ง array 'user_ids' ที่มีอย่างน้อย 1 ID"
        });
    }

    try {
        let successCount = 0;
        let failureCount = 0;
        const failedUsers = [];

        for (const user_id of user_ids) {
            try {
                // เช็กว่ามี active rental
                const [activeRentals] = await dbCon.promise().query(
                    "SELECT rental_id FROM Rentals WHERE user_id = ? AND status = 'active' AND deleted_at IS NULL",
                    [user_id]
                );

                if (activeRentals.length > 0) {
                    failedUsers.push({
                        user_id,
                        error: "active_rentals",
                        message: "ไม่สามารถลบ มีการยืมที่ยังไม่คืน"
                    });
                    failureCount++;
                    continue;
                }

                // Soft delete
                const [result] = await dbCon.promise().query(
                    "UPDATE Users SET deleted_at = NOW() WHERE user_id = ? AND deleted_at IS NULL",
                    [user_id]
                );

                if (result.affectedRows === 0) {
                    failedUsers.push({
                        user_id,
                        error: "not_found",
                        message: "ไม่พบผู้ใช้นี้"
                    });
                    failureCount++;
                } else {
                    successCount++;
                }
            } catch (err) {
                failedUsers.push({
                    user_id,
                    error: "database_error",
                    message: err.message
                });
                failureCount++;
            }
        }

        return res.status(200).json({
            error: false,
            message: `ลบผู้ใช้สำเร็จ ${successCount} คน (ล้มเหลว ${failureCount} คน)`,
            summary: {
                total: user_ids.length,
                success: successCount,
                failure: failureCount
            },
            failed_users: failedUsers.length > 0 ? failedUsers : undefined
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};

// 5️⃣ [BULK] Delete books หลายเล่มพร้อมกัน
exports.bulkDeleteBooks = async (req, res) => {
    const { book_ids } = req.body;

    if (!book_ids || !Array.isArray(book_ids) || book_ids.length === 0) {
        return res.status(400).json({
            error: true,
            message: "กรุณาส่ง array 'book_ids' ที่มีอย่างน้อย 1 ID"
        });
    }

    try {
        let successCount = 0;
        let failureCount = 0;
        const failedBooks = [];

        for (const book_id of book_ids) {
            try {
                // เช็กสถานะ
                const [books] = await dbCon.promise().query(
                    "SELECT status FROM Books WHERE book_id = ? AND deleted_at IS NULL",
                    [book_id]
                );

                if (books.length === 0) {
                    failedBooks.push({
                        book_id,
                        error: "not_found",
                        message: "ไม่พบหนังสือนี้"
                    });
                    failureCount++;
                    continue;
                }

                if (books[0].status === 'rented') {
                    failedBooks.push({
                        book_id,
                        error: "book_rented",
                        message: "ไม่สามารถลบ หนังสือกำลังถูกยืมอยู่"
                    });
                    failureCount++;
                    continue;
                }

                // Soft delete
                await dbCon.promise().query(
                    "UPDATE Books SET deleted_at = NOW() WHERE book_id = ? AND deleted_at IS NULL",
                    [book_id]
                );

                successCount++;
            } catch (err) {
                failedBooks.push({
                    book_id,
                    error: "database_error",
                    message: err.message
                });
                failureCount++;
            }
        }

        return res.status(200).json({
            error: false,
            message: `ลบหนังสือสำเร็จ ${successCount} เล่ม (ล้มเหลว ${failureCount} เล่ม)`,
            summary: {
                total: book_ids.length,
                success: successCount,
                failure: failureCount
            },
            failed_books: failedBooks.length > 0 ? failedBooks : undefined
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
};
