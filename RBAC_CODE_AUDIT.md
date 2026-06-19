# 🔍 RBAC Code Audit vs Plan

**วันตรวจสอบ:** 2026-06-16  
**มิชชั่น:** ตรวจสอบว่าโค้ดตรงกับแผนผัง RBAC ที่อัปเดต

---

## 📋 สรุปผลการตรวจสอบ

### ✅ ถูกต้องแล้ว (Green Flags)
| API | Role | Routes | Status |
|-----|------|--------|--------|
| Auth | - | ✅ Register/Login | ✅ |
| **Users GET** | Admin | ✅ `/users` (isAdmin) | ✅ |
| **Users GET** | Member | ✅ `/users/:id` (verifyToken) | ⚠️ No owner check |
| **Users CREATE** | Admin | ✅ `/users/create` (isAdmin) | ✅ |
| **Users UPDATE** | Admin | ✅ `/users/edit/:id` (isAdmin) | ✅ |
| **Users DELETE** | Admin | ✅ `/users/delete/:id` (isAdmin) | ✅ |
| **Books GET** | Member | ✅ `/books` (isMember) | ✅ |
| **Rentals GET** | Both | ⚠️ `/rentals` (verifyToken) | ⚠️ Role filter incomplete |
| **Rentals CREATE** | Member | ✅ `/rentals/create` (verifyToken) | ✅ |
| **Rentals APPROVE** | Admin | ✅ `/approve/:id` (isAdmin) | ✅ |
| **Rentals UPDATE** | Admin | ✅ `/rentals/update/:id` (isAdmin) | ✅ |
| **Rentals DELETE** | Admin | ✅ `/rentals/delete/:id` (isAdmin) | ✅ |

---

### ❌ ผิดตามแผน (Red Flags)

#### 🔴 **CRITICAL #1: Book Routes - Role Middleware ผิด**

**แผน:**
```
POST   /books/addBook      → Admin only ✅
PATCH  /books/update/:id   → Admin only ✅
DELETE /books/delete/:id   → Admin only ✅
```

**ปัจจุบัน (ผิด!):**
```
POST   /book/create        → isMember ❌ (ควรเป็น isAdmin)
POST   /book/update/:id    → isMember ❌ (ควรเป็น isAdmin)
DELETE /book/delete/:id    → isMember ❌ (ควรเป็น isAdmin)
```

**ไฟล์:** `backend/src/routes/bookRoutes.js:11-13`

---

#### 🔴 **CRITICAL #2: Book Controller `patch()` - Wrong Logic**

**ไฟล์:** `backend/src/controllers/books.js:89-185`

**ปัญหา:**
- Function ชื่อ `patch()` แต่ comment บอกว่า "แก้ไขข้อมูลหนังสือ"
- แต่โค้ด ดำเนินการ rental logic (`rental_id`, `rental_status`, `due_date`)
- **ควรเป็น:** Book update (title, author, isbn)
- **ปัจจุบัน:** Rental status update (copy-paste ผิด)

**ต้องแก้:**
- ลบ function นี้ออกจาก books.js (มี duplicate ใน rentals.js)
- เขียน function ใหม่สำหรับ update book data

---

#### 🟡 **MAJOR #3: Book Routes - Endpoint Path ไม่ตรงแผน**

**แผน:**
```
GET    /books          ← ดูรายชื่อหนังสือ
POST   /books/addBook  ← เพิ่มหนังสือใหม่
PATCH  /books/update/:id
DELETE /books/delete/:id
```

**ปัจจุบัน:**
```
GET    /book           ← เอกพจน์ (ควร /books)
POST   /book/create    ← ชื่อต่างจากแผน
POST   /book/update/:id ← ใช้ POST แทน PATCH
DELETE /book/delete/:id
```

**ไฟล์:** `backend/src/routes/bookRoutes.js:9-13`

---

#### 🟡 **MAJOR #4: Rental GET - Member Role Filter ไม่สมบูรณ์**

**ปัจจุบัน:**
```javascript
// rentals.js:10-12 (ที่อ่านครั้งแรก)
let user_id = req.query.user_id;
if (req.user.role !== 'admin') {
    user_id = req.user.user_id;  // ← reassign ไม่ได้ (const)
}
```

**ปัญหา:**
- `user_id` มาจาก destructure (const) ไม่สามารถ reassign
- Member ยังเห็นได้ว่าพยายามส่ง user_id ไปเพื่อดูคนอื่น (ถ้าไม่มี validation)

**ต้องแก้:** เปลี่ยนเป็น `let` ให้ reassign ได้

---

#### 🟡 **MAJOR #5: Rental CREATE - due_date Validation ไม่สมบูรณ์**

**ปัจจุบัน:**
```javascript
// rentals.js:80
today.setHours(0, 0, 0, 0);  // ← today ไม่ได้ประกาศ!
```

**ปัญหา:**
- Code วนรอบ `today` ไม่ได้ประกาศ (ReferenceError)
- ต้องมี validation `due_date` ต้อง > วันปัจจุบัน

**ต้องแก้:**
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
const dueDate = new Date(due_date);
if (dueDate < today) {
    return res.status(400).json({ error: true, message: "วันคืนต้องมากกว่าวันปัจจุบัน" });
}
```

---

#### 🟡 **MAJOR #6: User GET/:id - No Owner Check**

**ปัจจุบัน:**
```javascript
// userRoutes.js:11 (ไม่มี isAdmin middleware)
router.get('/users/:id', verifyToken, userController.getById);
```

**ปัญหา:**
- Member สามารถ `GET /users/999` ดูข้อมูล User ที่ ID 999 ได้
- ตามแผน: Member ควรดูแค่ตัวเองเท่านั้น

**ต้องแก้:** เพิ่ม owner check หรือ isAdmin middleware

---

## 📊 Routes Audit Matrix

### Auth Routes
```
POST /register  ✅ ถูก
POST /login     ✅ ถูก
```

### User Routes  
```
GET    /users              ✅ Admin only (isAdmin)
GET    /users/:id          ⚠️ Need owner check
POST   /users/create       ✅ Admin only (isAdmin)
PATCH  /users/edit/:id     ✅ Admin only (isAdmin)
DELETE /users/delete/:id   ✅ Admin only (isAdmin)
POST   /upload-profile     ✅ Member upload (verifyToken)
```

### Book Routes ❌ **WRONG!**
```
GET    /book               ❌ Path (should be /books)
GET    /book/:id           ❌ Path + Role (isMember should be public)
POST   /book/create        ❌ Role (isMember should be isAdmin)
POST   /book/update/:id    ❌ Role + Method (POST should be PATCH, isMember should be isAdmin)
DELETE /book/delete/:id    ❌ Role (isMember should be isAdmin)
```

### Rental Routes
```
GET    /rentals            ⚠️ Has role filter bug
POST   /rentals/create     ✅ Member only (verifyToken) but need due_date validation
PUT    /approve/:id        ✅ Admin only (isAdmin)
PATCH  /rentals/update/:id ✅ Admin only (isAdmin)
DELETE /rentals/delete/:id ✅ Admin only (isAdmin)
```

---

## 🛠️ Fix Priority

### 🔴 **Critical (Block deployment)**
1. **Book Routes - Fix Role Middleware** (changeBookRoutes.js)
   - Change `isMember` → `isAdmin` for POST, PATCH, DELETE

2. **Book Controller - Fix `patch()` Logic** (fix rentals.js or books.js)
   - Remove wrong rental logic from books.js
   - Implement proper book update (title, author, isbn)

3. **Rental CREATE - Fix `today` undefined** (fix rentals.js)
   - Declare `today` variable
   - Add due_date validation

### 🟡 **Major (Need fixing)**
4. **Rental GET - Fix const reassign** (fix rentals.js)
   - Change `const` → `let` for user_id

5. **Book Routes - Fix Paths** (fix bookRoutes.js)
   - `/book` → `/books` (plural)
   - `/book/create` → `/books/addBook` (match plan)
   - `POST /book/update` → `PATCH /books/update` (HTTP method)

6. **User GET/:id - Add owner check** (fix userRoutes.js or user controller)
   - Member can only view own profile

---

## ✅ Next Steps

ต้องแก้โค้ดตามที่ลงช่วงนี้:
1. Fix bookRoutes.js (Role middleware)
2. Fix books.js (Remove wrong patch logic)
3. Fix rentals.js (today variable + due_date validation)
4. Fix user access control

พร้อมเหรอ? 🚀
