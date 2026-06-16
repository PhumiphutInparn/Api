-- สร้างตาราง Fines เพื่อเก็บข้อมูลค่าปรับ
CREATE TABLE IF NOT EXISTS Fines (
    fine_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    rental_id INT,
    book_id INT,
    fine_amount DECIMAL(10, 2) NOT NULL,
    fine_reason VARCHAR(255) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (rental_id) REFERENCES Rentals(rental_id),
    FOREIGN KEY (book_id) REFERENCES Books(book_id)
);

-- เพิ่ม column ใน Users เพื่อเก็บ status
ALTER TABLE Users ADD COLUMN IF NOT EXISTS user_status ENUM('active', 'suspended') DEFAULT 'active';
ALTER TABLE Users ADD COLUMN IF NOT EXISTS total_unpaid_fines DECIMAL(10, 2) DEFAULT 0;

-- เพิ่ม column ใน Books เพื่อเก็บวันที่ mark lost
ALTER TABLE Books ADD COLUMN IF NOT EXISTS marked_lost_date TIMESTAMP NULL;

-- เพิ่ม column ใน Rentals เพื่อเก็บข้อมูล fine
ALTER TABLE Rentals ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE Rentals ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT FALSE;

-- เพิ่ม index เพื่อ query ที่เร็วขึ้น
CREATE INDEX idx_user_status ON Users(user_status);
CREATE INDEX idx_fines_user ON Fines(user_id);
CREATE INDEX idx_fines_paid ON Fines(is_paid);
CREATE INDEX idx_rentals_status ON Rentals(status);
CREATE INDEX idx_books_status ON Books(status);
