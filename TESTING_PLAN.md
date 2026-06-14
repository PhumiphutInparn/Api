# 📋 Library API - Complete Testing Plan

## ✅ ที่ทดสอบแล้ว
1. ✅ Register: `/register` 
2. ✅ Update user: `/users/:id` (PATCH)
3. ✅ Add book: `/book/create` (POST)
4. ✅ Update book status: `/book/update/:id` (PATCH)
5. ✅ Book pagination: `/book?page=1&limit=2` (GET)

---

## 🔄 ต้องทดสอบต่อ

### **A. Authentication (2 endpoints)**

#### 1. Login
```
POST http://localhost:3000/login
{
  "email": "student01@rmutt.ac.th",
  "password": "123456"
}
```
**Expected:** ✅ 200 - Success with JWT token

---

#### 2. Register New User
```
POST http://localhost:3000/register
{
  "email": "admin@rmutt.ac.th",
  "password": "admin123",
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin"
}
```
**Expected:** ✅ 201 - User created

---

### **B. User Management (3 endpoints)**

#### 3. Get All Users (with search + pagination)
```
GET http://localhost:3000/users?page=1&limit=5&search=test
```
**Expected:** ✅ 200 - List users with pagination

#### 4. Get All Users (no filter)
```
GET http://localhost:3000/users
```
**Expected:** ✅ 200 - Show all users

#### 5. Delete User
```
DELETE http://localhost:3000/users/11
```
**Expected:** ✅ 200 - User deleted (or 409 if has active rentals)

---

### **C. Book Management (5 endpoints)**

#### 6. Get All Books
```
GET http://localhost:3000/book/
```
**Expected:** ✅ 200 - List all books

#### 7. Get All Books with Search
```
GET http://localhost:3000/book?search=Python&status=available
```
**Expected:** ✅ 200 - Filter by title/author and status

#### 8. Get Single Book
```
GET http://localhost:3000/book/1
```
**Expected:** ✅ 200 - Show book detail with borrower info

#### 9. Delete Book
```
DELETE http://localhost:3000/book/delete/1
```
**Expected:** ✅ 200 - Book deleted (or 409 if rented)

#### 10. Get All Books with Pagination
```
GET http://localhost:3000/book?page=1&limit=3
```
**Expected:** ✅ 200 - Books with pagination

---

### **D. Rental Management (4 endpoints)**

#### 11. Get All Rentals
```
GET http://localhost:3000/rentals
```
**Expected:** ✅ 200 - List all rentals

#### 12. Get Rentals with Filter
```
GET http://localhost:3000/rentals?user_id=1&status=active
```
**Expected:** ✅ 200 - Filter rentals

#### 13. Borrow Book (Create Rental)
```
POST http://localhost:3000/rentals
{
  "user_id": 1,
  "book_id": 2
}
```
**Expected:** ✅ 201 - Rental created (or 409 if user has fine/overdue)

#### 14. Return Book (Update Rental)
```
PATCH http://localhost:3000/rentals/1
```
**Expected:** ✅ 200 - Rental marked as returned

#### 15. Delete Rental Record
```
DELETE http://localhost:3000/rentals/1
```
**Expected:** ✅ 200 - (or 409 if still active)

---

### **E. Fine Management (4 endpoints)**

#### 16. Get All Fines
```
GET http://localhost:3000/fines?page=1&limit=10
```
**Expected:** ✅ 200 - List all fines

#### 17. Get Fines by User
```
GET http://localhost:3000/fines/user/1
```
**Expected:** ✅ 200 - User fines + status

#### 18. Pay Fine
```
PATCH http://localhost:3000/fines/pay/1
```
**Expected:** ✅ 200 - Fine marked as paid

#### 19. Process Overdue Books (Auto-create fines)
```
POST http://localhost:3000/fines/process-overdue
```
**Expected:** ✅ 200 - Process overdue + create fines

---

### **F. Bulk Operations (5 endpoints)**

#### 20. Bulk Add Users
```
POST http://localhost:3000/bulk/users
{
  "users": [
    {"email":"test1@test.com","password":"123","first_name":"Test1"},
    {"email":"test2@test.com","password":"123","first_name":"Test2"}
  ]
}
```
**Expected:** ✅ 201 - Success 2 (Failure 0)

#### 21. Bulk Add Books
```
POST http://localhost:3000/bulk/books
{
  "books": [
    {"title":"Book1","author":"Author1","isbn":"111-111"},
    {"title":"Book2","author":"Author2","isbn":"222-222"}
  ]
}
```
**Expected:** ✅ 201 - Success 2 (Failure 0)

#### 22. Bulk Add Rentals
```
POST http://localhost:3000/bulk/rentals
{
  "rentals": [
    {"user_id":1,"book_id":5},
    {"user_id":2,"book_id":6}
  ]
}
```
**Expected:** ✅ 201 - Success 2 (or with failures)

#### 23. Bulk Delete Users
```
POST http://localhost:3000/bulk/delete-users
{
  "user_ids": [10, 11]
}
```
**Expected:** ✅ 200 - Delete users

#### 24. Bulk Delete Books
```
POST http://localhost:3000/bulk/delete-books
{
  "book_ids": [7, 8, 9]
}
```
**Expected:** ✅ 200 - Delete books

---

## 📊 Testing Scenarios (Edge Cases)

### **Scenario 1: User with Fine tries to Borrow**
```
1. Create fine for user 1
2. Try: POST /rentals {"user_id":1,"book_id":3}
3. Expected: ❌ 409 - "ไม่สามารถยืมหนังสือได้ เนื่องจาก: ค่าปรับค้างชำระ"
```

### **Scenario 2: Borrow Same Book Twice**
```
1. POST /rentals {"user_id":1,"book_id":3}
2. POST /rentals {"user_id":1,"book_id":3}
3. Expected: ❌ 409 - "ผู้ใช้ยืมหนังสือนี้อยู่แล้ว"
```

### **Scenario 3: Borrow Unavailable Book**
```
1. POST /rentals {"user_id":1,"book_id":3} (book 3 already rented)
2. POST /rentals {"user_id":2,"book_id":3}
3. Expected: ❌ 409 - "ไม่พร้อมให้บริการ (ติดสถานะ: rented)"
```

### **Scenario 4: Delete User with Active Rental**
```
1. User 1 borrows book 5
2. DELETE /users/1
3. Expected: ❌ 409 - "ไม่สามารถลบบัญชี ยังมีรายการหนังสือที่ยังไม่ได้คืน"
```

### **Scenario 5: Bulk Add with Duplicate Email**
```
POST /bulk/users
{
  "users": [
    {"email":"duplicate@test.com","password":"123","first_name":"User1"},
    {"email":"duplicate@test.com","password":"123","first_name":"User2"}
  ]
}
```
**Expected:** ✅ 201 - Success 1, Failure 1 (show error detail)

---

## 📝 Testing Checklist

- [ ] Authentication (Login/Register)
- [ ] User CRUD + Search + Pagination
- [ ] Book CRUD + Search + Pagination
- [ ] Rental CRUD + Filter
- [ ] Fine Management + Payment
- [ ] Process Overdue Books
- [ ] Bulk Operations (Add/Delete)
- [ ] Error Handling (409, 404, 400)
- [ ] Status/Fine Prevention Logic
- [ ] All Edge Cases

---

## 🚀 Run All Tests

Suggest using **Postman** or **Thunder Client** to test all endpoints with the provided JSON bodies above.

Total Endpoints to Test: **24 main + 5 edge cases = 29 tests**
