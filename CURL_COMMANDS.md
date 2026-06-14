# 📌 Library API - curl Commands (สำหรับ Postman/Terminal)

## ==================== A. AUTHENTICATION ====================

### 1️⃣ Register
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","first_name":"Admin","last_name":"User","role":"admin"}'
```

### 2️⃣ Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student01@rmutt.ac.th","password":"123456"}'
```

---

## ==================== B. USER MANAGEMENT ====================

### 3️⃣ Get All Users
```bash
curl -X GET "http://localhost:3000/users?page=1&limit=5" \
  -H "Content-Type: application/json"
```

### 4️⃣ Search Users
```bash
curl -X GET "http://localhost:3000/users?search=test&page=1&limit=5" \
  -H "Content-Type: application/json"
```

### 5️⃣ Update User
```bash
curl -X PATCH http://localhost:3000/users/11 \
  -H "Content-Type: application/json" \
  -d '{"role":"admin","first_name":"Super"}'
```

### 6️⃣ Delete User
```bash
curl -X DELETE http://localhost:3000/users/1 \
  -H "Content-Type: application/json"
```

---

## ==================== C. BOOK MANAGEMENT ====================

### 7️⃣ Get All Books
```bash
curl -X GET "http://localhost:3000/book/" \
  -H "Content-Type: application/json"
```

### 8️⃣ Get Books with Pagination
```bash
curl -X GET "http://localhost:3000/book?page=1&limit=2" \
  -H "Content-Type: application/json"
```

### 9️⃣ Search Books
```bash
curl -X GET "http://localhost:3000/book?search=Python&status=available" \
  -H "Content-Type: application/json"
```

### 🔟 Get Single Book
```bash
curl -X GET "http://localhost:3000/book/1" \
  -H "Content-Type: application/json"
```

### 1️⃣1️⃣ Add New Book
```bash
curl -X POST http://localhost:3000/book/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Advanced Node.js","author":"Expert Programmer","isbn":"978-1-1111-1111-1"}'
```

### 1️⃣2️⃣ Update Book Status
```bash
curl -X POST http://localhost:3000/book/update/6 \
  -H "Content-Type: application/json" \
  -d '{"status":"available"}'
```

### 1️⃣3️⃣ Delete Book
```bash
curl -X DELETE http://localhost:3000/book/delete/1 \
  -H "Content-Type: application/json"
```

---

## ==================== D. RENTAL MANAGEMENT ====================

### 1️⃣4️⃣ Get All Rentals
```bash
curl -X GET "http://localhost:3000/rentals?page=1&limit=10" \
  -H "Content-Type: application/json"
```

### 1️⃣5️⃣ Filter Rentals by User
```bash
curl -X GET "http://localhost:3000/rentals?user_id=2&status=active" \
  -H "Content-Type: application/json"
```

### 1️⃣6️⃣ Borrow Book
```bash
curl -X POST http://localhost:3000/rentals \
  -H "Content-Type: application/json" \
  -d '{"user_id":2,"book_id":3}'
```

### 1️⃣7️⃣ Return Book
```bash
curl -X PATCH http://localhost:3000/rentals/1 \
  -H "Content-Type: application/json"
```

### 1️⃣8️⃣ Delete Rental
```bash
curl -X DELETE http://localhost:3000/rentals/2 \
  -H "Content-Type: application/json"
```

---

## ==================== E. FINE MANAGEMENT ====================

### 1️⃣9️⃣ Get All Fines
```bash
curl -X GET "http://localhost:3000/fines?page=1&limit=10" \
  -H "Content-Type: application/json"
```

### 2️⃣0️⃣ Get Fines by User
```bash
curl -X GET "http://localhost:3000/fines/user/1" \
  -H "Content-Type: application/json"
```

### 2️⃣1️⃣ Pay Fine
```bash
curl -X PATCH http://localhost:3000/fines/pay/1 \
  -H "Content-Type: application/json"
```

### 2️⃣2️⃣ Process Overdue Books
```bash
curl -X POST http://localhost:3000/fines/process-overdue \
  -H "Content-Type: application/json"
```

---

## ==================== F. BULK OPERATIONS ====================

### 2️⃣3️⃣ Bulk Add Users
```bash
curl -X POST http://localhost:3000/bulk/users \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {"email":"bulk1@test.com","password":"pass123","first_name":"BulkUser1","last_name":"Test"},
      {"email":"bulk2@test.com","password":"pass123","first_name":"BulkUser2","last_name":"Test"}
    ]
  }'
```

### 2️⃣4️⃣ Bulk Add Books
```bash
curl -X POST http://localhost:3000/bulk/books \
  -H "Content-Type: application/json" \
  -d '{
    "books": [
      {"title":"Bulk Book 1","author":"Author One","isbn":"999-1001"},
      {"title":"Bulk Book 2","author":"Author Two","isbn":"999-1002"},
      {"title":"Bulk Book 3","author":"Author Three","isbn":"999-1003"}
    ]
  }'
```

### 2️⃣5️⃣ Bulk Add Rentals
```bash
curl -X POST http://localhost:3000/bulk/rentals \
  -H "Content-Type: application/json" \
  -d '{
    "rentals": [
      {"user_id":2,"book_id":4},
      {"user_id":3,"book_id":5}
    ]
  }'
```

### 2️⃣6️⃣ Bulk Delete Users
```bash
curl -X POST http://localhost:3000/bulk/delete-users \
  -H "Content-Type: application/json" \
  -d '{"user_ids":[10,11,12]}'
```

### 2️⃣7️⃣ Bulk Delete Books
```bash
curl -X POST http://localhost:3000/bulk/delete-books \
  -H "Content-Type: application/json" \
  -d '{"book_ids":[7,8,9]}'
```

---

## 🚀 วิธีใช้

### **Option 1: ยิงทีละคำสั่ง**
```bash
# Copy & Paste คำสั่ง curl ใดๆ ลงใน Terminal/Command Prompt
curl -X GET "http://localhost:3000/users"
```

### **Option 2: ยิงทั้งหมดพร้อมกัน**
```bash
# ใช้ bash script
bash test-all-api.sh
```

### **Option 3: ใช้ Postman**
- Import ข้อมูล JSON body
- Paste URL
- Select HTTP method (GET/POST/PATCH/DELETE)
- Click Send

---

## 📝 Notes

- ⚠️ เปลี่ยน ID (user_id, book_id, rental_id) ตามข้อมูลที่มีในฐานข้อมูล
- ✅ Server ต้องเปิด: `npm start`
- 🔗 Base URL: `http://localhost:3000`
- 📊 ทั้งหมด 27 endpoints
