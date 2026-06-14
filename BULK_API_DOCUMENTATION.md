# Bulk Operations API Documentation

## 📌 Overview
API endpoints สำหรับเพิ่ม/ลบข้อมูลหลายรายการพร้อมกัน

---

## 🔧 POST Endpoints (Create)

### 1️⃣ เพิ่มผู้ใช้หลายคนพร้อมกัน
```
POST /bulk/users
```

**Body:**
```json
{
  "users": [
    {
      "email": "user1@example.com",
      "password": "pass123",
      "first_name": "สมชาย",
      "last_name": "ใจดี",
      "role": "member"
    },
    {
      "email": "user2@example.com",
      "password": "pass456",
      "first_name": "สมหญิง",
      "last_name": "จำรัส",
      "role": "admin"
    }
  ]
}
```

**Response (201):**
```json
{
  "error": false,
  "message": "เพิ่มผู้ใช้สำเร็จ 2 คน (ล้มเหลว 0 คน)",
  "summary": {
    "total": 2,
    "success": 2,
    "failure": 0
  }
}
```

**Response (201 - มี error บางส่วน):**
```json
{
  "error": false,
  "message": "เพิ่มผู้ใช้สำเร็จ 1 คน (ล้มเหลว 1 คน)",
  "summary": {
    "total": 2,
    "success": 1,
    "failure": 1
  },
  "failed_users": [
    {
      "email": "duplicate@example.com",
      "error": "duplicate_email",
      "message": "อีเมลนี้ถูกใช้งานแล้ว"
    }
  ]
}
```

---

### 2️⃣ เพิ่มหนังสือหลายเล่มพร้อมกัน
```
POST /bulk/books
```

**Body:**
```json
{
  "books": [
    {
      "title": "Python Programming",
      "author": "Guido van Rossum",
      "isbn": "978-0134689197",
      "status": "available"
    },
    {
      "title": "JavaScript The Good Parts",
      "author": "Douglas Crockford",
      "isbn": "978-0596517748",
      "status": "available"
    },
    {
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "isbn": "978-0132350884"
    }
  ]
}
```

**Response (201):**
```json
{
  "error": false,
  "message": "เพิ่มหนังสือสำเร็จ 3 เล่ม (ล้มเหลว 0 เล่ม)",
  "summary": {
    "total": 3,
    "success": 3,
    "failure": 0
  }
}
```

---

### 3️⃣ เพิ่มการยืมหลายรายการพร้อมกัน
```
POST /bulk/rentals
```

**Body:**
```json
{
  "rentals": [
    {
      "user_id": 1,
      "book_id": 1
    },
    {
      "user_id": 2,
      "book_id": 2
    },
    {
      "user_id": 3,
      "book_id": 3
    }
  ]
}
```

**Features:**
- ✅ ตรวจสอบ user status (fine, overdue)
- ✅ ตรวจสอบสถานะหนังสือ
- ✅ ป้องกัน duplicate rental
- ✅ อัปเดตสถานะหนังสือ

**Response (201):**
```json
{
  "error": false,
  "message": "เพิ่มการยืมสำเร็จ 3 รายการ (ล้มเหลว 0 รายการ)",
  "summary": {
    "total": 3,
    "success": 3,
    "failure": 0
  }
}
```

**Response (201 - มี error):**
```json
{
  "error": false,
  "message": "เพิ่มการยืมสำเร็จ 2 รายการ (ล้มเหลว 1 รายการ)",
  "summary": {
    "total": 3,
    "success": 2,
    "failure": 1
  },
  "failed_rentals": [
    {
      "user_id": 2,
      "book_id": 2,
      "error": "user_status_issue",
      "message": "ผู้ใช้มีปัญหา: มี fine ค้าง, มี overdue books"
    }
  ]
}
```

---

## 🗑️ DELETE Endpoints

### 4️⃣ ลบผู้ใช้หลายคนพร้อมกัน
```
POST /bulk/delete-users
```

**Body:**
```json
{
  "user_ids": [1, 2, 3]
}
```

**Validation:**
- ❌ ไม่สามารถลบได้ถ้ามี active rental (ยังไม่คืนหนังสือ)

**Response:**
```json
{
  "error": false,
  "message": "ลบผู้ใช้สำเร็จ 3 คน (ล้มเหลว 0 คน)",
  "summary": {
    "total": 3,
    "success": 3,
    "failure": 0
  }
}
```

---

### 5️⃣ ลบหนังสือหลายเล่มพร้อมกัน
```
POST /bulk/delete-books
```

**Body:**
```json
{
  "book_ids": [1, 2, 3]
}
```

**Validation:**
- ❌ ไม่สามารถลบได้ถ้าหนังสือมีสถานะ 'rented'

**Response:**
```json
{
  "error": false,
  "message": "ลบหนังสือสำเร็จ 3 เล่ม (ล้มเหลว 0 เล่ม)",
  "summary": {
    "total": 3,
    "success": 3,
    "failure": 0
  }
}
```

---

## 📊 Response Structure

### Success Response
```json
{
  "error": false,
  "message": "ระบบสำเร็จ X รายการ (ล้มเหลว Y รายการ)",
  "summary": {
    "total": 10,      // จำนวนทั้งหมดที่ส่งมา
    "success": 9,     // สำเร็จ
    "failure": 1      // ล้มเหลว
  },
  "failed_[items]": [  // (optional) เฉพาะเมื่อมี error
    {
      "id": "value",
      "error": "error_code",
      "message": "คำอธิบาย"
    }
  ]
}
```

---

## 🛠️ Error Codes

### Users
- `missing_fields` - ไม่มี email, password, first_name
- `duplicate_email` - อีเมลซ้ำ
- `active_rentals` - มีการยืมที่ยังไม่ได้คืน
- `not_found` - ไม่พบผู้ใช้

### Books
- `missing_fields` - ไม่มี title, author, isbn
- `duplicate_isbn` - ISBN ซ้ำ
- `book_not_found` - ไม่พบหนังสือ
- `book_not_available` - หนังสือไม่พร้อม

### Rentals
- `missing_fields` - ไม่มี user_id, book_id
- `user_status_issue` - ผู้ใช้มี fine/overdue books
- `book_not_found` - ไม่พบหนังสือ
- `book_not_available` - หนังสือไม่พร้อม
- `duplicate_rental` - ผู้ใช้ยืมหนังสือนี้อยู่แล้ว

---

## 🧪 Testing with cURL/Postman

### เพิ่มผู้ใช้ 2 คน:
```bash
curl -X POST http://localhost:3000/bulk/users \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {"email":"a@test.com","password":"123456","first_name":"ก"},
      {"email":"b@test.com","password":"123456","first_name":"ข"}
    ]
  }'
```

### เพิ่มหนังสือ 3 เล่ม:
```bash
curl -X POST http://localhost:3000/bulk/books \
  -H "Content-Type: application/json" \
  -d '{
    "books": [
      {"title":"Book1","author":"Author1","isbn":"111"},
      {"title":"Book2","author":"Author2","isbn":"222"},
      {"title":"Book3","author":"Author3","isbn":"333"}
    ]
  }'
```

### ลบผู้ใช้ 2 คน:
```bash
curl -X POST http://localhost:3000/bulk/delete-users \
  -H "Content-Type: application/json" \
  -d '{"user_ids":[1,2]}'
```

---

## ⚠️ Important Notes

1. **Transaction Safety**: หากมี error ตรงกลาง การ commit จะหยุด (partial success)
2. **Performance**: สำหรับ bulk เพิ่มจำนวนมาก (1000+) ควรแบ่งเป็น batch เล็กๆ
3. **Validation**: ตรวจสอบ role, status ให้ถูกต้อง
4. **Soft Delete**: ลบข้อมูลใช้ soft delete (update deleted_at)
