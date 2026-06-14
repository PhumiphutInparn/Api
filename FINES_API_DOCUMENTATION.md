# Library API - Status/Fine System Documentation

## ✅ Features Implemented

### 1. **User Status System**
- `user_status`: `active` (ปกติ) หรือ `suspended` (ถูกระงับจากการยืม)
- `total_unpaid_fines`: ยอดรวมค่าปรับที่ยังไม่ได้จ่าย

### 2. **Fine System**
- ระบบตรวจสอบหนังสือที่เกินกำหนด (overdue > 7 วัน)
- สร้างค่าปรับโดยอัตโนมัติ (50 บาท/วัน สูงสุด 500 บาท)
- ทำเครื่องหมายหนังสือเป็น 'lost' หลังจาก 7 วีค้างคืน

### 3. **Borrow Prevention Logic**
ผู้ใช้งานจะ **ยืมไม่ได้** ถ้า:
- ✘ มีค่าปรับค้างชำระ
- ✘ มีหนังสือที่เกินกำหนด
- ✘ หนังสือที่ต้องการยืมกำลังถูกยืมอยู่
- ✘ ยืมหนังสือเดียวกันนี้อยู่แล้ว

---

## 📌 New API Endpoints

### **Fines Management**

#### 1. ดึงข้อมูลค่าปรับทั้งหมด
```
GET /fines?page=1&limit=10&user_id=1&is_paid=false
```
**Parameters:**
- `page` - หน้าที่ (default: 1)
- `limit` - จำนวนรายการต่อหน้า (default: 10)
- `user_id` - (optional) รหัสผู้ใช้งาน
- `is_paid` - (optional) `true` หรือ `false`

**Response:**
```json
{
  "error": false,
  "data": [
    {
      "fine_id": 1,
      "user_id": 1,
      "rental_id": 5,
      "book_id": 3,
      "fine_amount": 150,
      "fine_reason": "หนังสือเกินกำหนด 3 วัน",
      "is_paid": false,
      "created_at": "2026-06-14 10:30:00",
      "paid_at": null,
      "first_name": "สมชาย",
      "last_name": "ใจดี",
      "title": "Python Programming"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_items": 15,
    "total_pages": 2
  }
}
```

#### 2. ดูค่าปรับของผู้ใช้งาน
```
GET /fines/user/:user_id
```

**Response:**
```json
{
  "error": false,
  "user_status": "suspended",
  "total_unpaid_fines": 350,
  "fines": [
    {
      "fine_id": 1,
      "fine_amount": 150,
      "fine_reason": "หนังสือเกินกำหนด 3 วัน",
      "is_paid": false,
      "created_at": "2026-06-14 10:30:00",
      "title": "Python Programming"
    }
  ]
}
```

#### 3. จ่ายค่าปรับ
```
PATCH /fines/pay/:fine_id
```

**Response:**
```json
{
  "error": false,
  "message": "จ่ายค่าปรับสำเร็จแล้ว"
}
```

#### 4. ประมวลผล Overdue Books (Cron Job)
```
POST /fines/process-overdue
```

**ทำให้:**
- ตรวจสอบหนังสือที่ยืมมากกว่า 7 วัน
- สร้างค่าปรับ (50 บาท/วัน, max 500 บาท)
- ทำเครื่องหมายหนังสือเป็น 'lost'
- เปลี่ยน user status เป็น 'suspended'

**ควรเรียกใช้:** ทุกวันเที่ยงคืน (ตั้ง Cron Job)

**Response:**
```json
{
  "error": false,
  "message": "ประมวลผลสำเร็จ 3 รายการ",
  "processed_count": 3
}
```

---

## 🚀 Updated Borrow Endpoint

### ยืมหนังสือ
```
POST /rentals
Body: {
  "user_id": 1,
  "book_id": 3
}
```

**Changes:**
- ✅ Check user status ก่อน
- ✅ Check unpaid fines
- ✅ Check overdue books
- ✅ Prevent duplicate borrow

**Success Response (201):**
```json
{
  "error": false,
  "message": "ยืมหนังสือสำเร็จ",
  "rental_id": 10,
  "due_date": "2026-06-21"
}
```

**Error Response (409) - มี fine ค้าง:**
```json
{
  "error": true,
  "message": "ไม่สามารถยืมหนังสือได้ เนื่องจาก: ค่าปรับค้างชำระ"
}
```

**Error Response (409) - มี overdue books:**
```json
{
  "error": true,
  "message": "ไม่สามารถยืมหนังสือได้ เนื่องจาก: มีหนังสือเกินกำหนด"
}
```

---

## 📊 Database Schema

### Fines Table
```sql
CREATE TABLE Fines (
    fine_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    rental_id INT,
    book_id INT,
    fine_amount DECIMAL(10, 2),
    fine_reason VARCHAR(255),
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
```

### Users Table (Updated Columns)
```sql
ALTER TABLE Users ADD user_status ENUM('active', 'suspended') DEFAULT 'active';
ALTER TABLE Users ADD total_unpaid_fines DECIMAL(10, 2) DEFAULT 0;
```

### Rentals Table (Updated Columns)
```sql
ALTER TABLE Rentals ADD fine_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE Rentals ADD is_overdue BOOLEAN DEFAULT FALSE;
```

### Books Table (Updated Columns)
```sql
ALTER TABLE Books ADD marked_lost_date TIMESTAMP NULL;
```

---

## 📋 Checklist Status

- ✅ Login
- ✅ Join/Register (show all users with search)
- ✅ Search (users & books)
- ✅ Status system with fines
- ✅ Overdue → Lost (7 days)
- ✅ Prevent borrowing if user has status issues
- ✅ Prevent duplicate borrowing

---

## ⚙️ Setup Instructions

### 1. Run Migration
```bash
mysql -h 127.0.0.1 -u root bookribary < migration_fines.sql
```

### 2. Setup Cron Job (Daily at 00:00)
```bash
0 0 * * * curl -X POST http://localhost:3000/fines/process-overdue
```

### 3. Restart Server
```bash
npm start
```

---

## 🔧 Testing

### Test Case 1: User with unpaid fines tries to borrow
```bash
POST /rentals
{
  "user_id": 1,
  "book_id": 2
}
```
Expected: ❌ 409 - "ไม่สามารถยืมหนังสือได้ เนื่องจาก: ค่าปรับค้างชำระ"

### Test Case 2: Pay fine and try to borrow again
```bash
PATCH /fines/pay/1
```
Then:
```bash
POST /rentals
{
  "user_id": 1,
  "book_id": 2
}
```
Expected: ✅ 201 - "ยืมหนังสือสำเร็จ"

### Test Case 3: Process overdue books
```bash
POST /fines/process-overdue
```
Expected: Books overdue 7+ days are marked as 'lost', fines created
