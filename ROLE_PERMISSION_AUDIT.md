# 📋 รายงานการตรวจสอบ Role & Permission

**วันตรวจสอบ:** 2026-06-16  
**ระบบตรวจสอบ:** Library Rental System (2 Roles + System)

---

## 📌 โลจิก Reference

### 👑 Admin (แอดมิน)
- ดูรายชื่อสมาชิกทั้งหมด / ดูรายคน (`GET /users`)
- สร้างสมาชิกใหม่ (`POST /users/create`)
- แก้ไขข้อมูลสมาชิก (`PATCH /users/edit/:id`)
- ลบสมาชิก (`DELETE /users/delete/:id`)
- ดูประวัติการยืมทั้งหมดของทุกคน (`GET /rentals`)
- **อนุมัติการยืม:** Pending → Active (`PUT /approve/:rental_id`)
- **อัปเดตสถานะหนังสือ:** คืน/ทำหาย (`PATCH /rentals/update/:id`)
- ลบบิลเช่า (Soft Delete) (`DELETE /rentals/delete/:id`)

### 🧑‍💻 Member (สมาชิก)
- ดูประวัติการยืมของ**ตัวเอง** เท่านั้น (`GET /rentals` + filter by own user_id)
- ส่งคำขอยืมหนังสือ (`POST /rentals/create`)
- เปลี่ยนรูปโปรไฟล์ของตัวเอง (`POST /upload-profile`)

### 🤖 System
- CRON Job: เที่ยงคืนตรง → เช็ค overdue > 30 วัน → set status `lost`

---

## ✅ ส่วนที่ถูกต้องแล้ว

| ฟีเจอร์ | สถานะ | หมายเหตุ |
|--------|--------|---------|
| **Admin User Management** | ✅ | `GET/POST/PATCH/DELETE /users/*` ใช้ `isAdmin` middleware ป้องกัน |
| **Register New User** | ✅ | Auto set `role = 'member'` ใน auth.js:19 |
| **Login & Token** | ✅ | JWT include `user_id` + `role` มาถูกต้อง |
| **Rental Create (Member)** | ✅ | ใช้ `req.user.user_id` จาก Token ป้องกันได้ |
| **Rental Approve (Admin)** | ✅ | มี `isAdmin` middleware ป้องกันได้ |
| **Rental Update (Admin)** | ✅ | มี `isAdmin` middleware ป้องกันได้ |
| **Rental Delete (Admin)** | ✅ | มี `isAdmin` middleware ป้องกันได้ |

---

## 🔴 ปัญหาที่ต้องแก้ (ร้ายแรง)

### ❌ 1. `GET /rentals` - Member เห็นประวัติของทุกคน

**ไฟล์:** 
- `backend/src/routes/rentalRoutes.js:10`
- `backend/src/controllers/rentals.js:9-16`

**ปัญหา:**
```javascript
// ❌ rentalRoutes.js:10 - ไม่มี isAdmin middleware
router.get('/rentals', verifyToken, rentalsController.get);

// ❌ rentals.js:9-16 - ยอมรับ user_id จาก query params
const { rental_id, user_id, book_id, status, search } = req.query;
if (user_id) { 
    filterSql += " AND r.user_id = ?"; 
    queryParams.push(user_id); 
}
```

**เหตุ:** 
- Member สามารถส่ง `GET /rentals?user_id=999` แล้วเห็นประวัติการยืมของคนรหัส 999
- Member ควรเห็นแค่ประวัติของตัวเอง (ต้องมาจาก Token เท่านั้น)

**Security Risk:** Information Disclosure (CWE-200)

**วิธีแก้:**
```javascript
// Option 1: เช็ก role + filter ตามสิทธิ์
if (req.user.role === 'member') {
    filterSql += " AND r.user_id = ?";
    queryParams.push(req.user.user_id);
} else if (user_id) {
    filterSql += " AND r.user_id = ?";
    queryParams.push(user_id);
}

// Option 2: ให้ Member ส่งมา แต่เช็กว่า user_id ต้องเท่า token
if (req.user.role === 'member' && req.query.user_id && req.query.user_id !== req.user.user_id) {
    return res.status(403).json({ error: true, message: "Forbidden" });
}
```

---

### ❌ 2. `POST /upload-profile` - Code ไม่สมบูรณ์ (userId undefined)

**ไฟล์:** `backend/src/controllers/user.js:61-95`

**ปัญหา:**
```javascript
// ❌ เส้น 70-73 - Code commented out ทำให้ userId ไม่ได้ assign ค่า
// const userId = req.user.user_id;  // ← ต่อ comment นี้

if (!userId) {  // ← userId จะ undefined เสมอ
    return res.status(400).json({ error: true, message: "ไม่พบ User ID ใน Token" });
}
```

**เหตุ:** บรรทัด 70-73 มี console.log + comment ที่ block การ assign ค่า

**วิธีแก้:**
```javascript
// ✅ เอา comment ออก + uncomment code จริง
const userId = req.user.user_id; 

if (!userId) {
    return res.status(400).json({ error: true, message: "ไม่พบ User ID ใน Token" });
}
```

---

## 🟡 ปัญหาที่ควรพิจารณา (ปานกลาง)

### ⚠️ 3. `GET /users/:id` - Member ดูข้อมูลคนอื่นได้

**ไฟล์:** `backend/src/routes/userRoutes.js:11`

**ปัญหา:**
```javascript
// ⚠️ ไม่มี isAdmin middleware
router.get('/users/:id', verifyToken, userController.getById);
```

**เหตุ:** 
- Member เข้า `GET /users/1` ดูข้อมูลของคนรหัส 1 ได้
- Profile public data ขั้นพื้นฐาน หรือควรจำกัด?

**ตัวเลือกแก้:**
```javascript
// Option 1: ให้ Admin + Member ดูตัวเองได้เท่านั้น
router.get('/users/:id', verifyToken, (req, res, next) => {
    const id = req.params.id;
    if (req.user.role === 'member' && req.user.user_id != id) {
        return res.status(403).json({ error: true, message: "Forbidden" });
    }
    next();
}, userController.getById);

// Option 2: เฉพาะ Admin ดูได้
router.get('/users/:id', verifyToken, isAdmin, userController.getById);
```

---

### ⚠️ 4. `POST /rentals/create` - due_date ไม่มี validation

**ไฟล์:** `backend/src/controllers/rentals.js:74-79`

**ปัญหา:**
```javascript
const { book_id, due_date } = req.body;

if (!book_id || !due_date) {
    return res.status(400).json({ error: true, message: "..." });
}
// ← ไม่เช็ก due_date ต้องถูกต้องไหม
```

**เหตุ:** 
- Member ส่ง `due_date: "2020-01-01"` (ในอดีต) ได้ผ่าน
- due_date ควรต้อง > วันปัจจุบัน

**วิธีแก้:**
```javascript
const { book_id, due_date } = req.body;

if (!book_id || !due_date) {
    return res.status(400).json({ error: true, message: "กรุณาระบุรหัสหนังสือ และวันที่ต้องการคืน" });
}

// ✅ เช็ก due_date ต้อง > วันปัจจุบัน
const dueDate = new Date(due_date);
const today = new Date();
today.setHours(0, 0, 0, 0);

if (dueDate < today) {
    return res.status(400).json({ error: true, message: "วันที่ต้องการคืนต้องมากกว่าวันปัจจุบัน" });
}
```

---

### ⚠️ 5. `PUT /approve/:rental_id` - Override due_date ที่ member ขอ

**ไฟล์:** `backend/src/controllers/rentals.js:137-138`

**ปัญหา:**
```javascript
// Admin ขอเปลี่ยน due_date ที่ member ขอ เป็น NOW() + 7 วัน
UPDATE Rentals SET 
    status = 'active', 
    rent_date = NOW(), 
    due_date = DATE_ADD(NOW(), INTERVAL 7 DAY)  // ← hardcode 7 วัน
```

**คำถาม:**
1. ✅ Admin ควรให้ยืม **7 วันเสมอ** (ไม่ยอมรับ due_date ที่ member ขอ)?
2. ✅ หรือ Admin ควร **อนุมัติ** due_date ที่ member ขอให้มีผล?
3. ✅ หรือ Admin ควรมีสิทธิ์ **ปรับ due_date** ใหม่?

**ส่วนนี้ต้องชี้แจงโลจิก**

---

## 📊 สรุป Checklist

| # | ฟีเจอร์ | Status | ต้องแก้ |
|---|--------|--------|--------|
| 1️⃣ | `GET /users` (Admin only) | ✅ | ไม่ |
| 2️⃣ | `POST/PATCH/DELETE /users` (Admin only) | ✅ | ไม่ |
| 3️⃣ | **`GET /rentals` (Member ดูของทุกคน)** | ❌ | **ใช่** |
| 4️⃣ | `POST /rentals/create` (validation) | ⚠️ | **ใช่** |
| 5️⃣ | `PUT /approve` (Override due_date) | ⚠️ | **ต้องชี้แจง** |
| 6️⃣ | **`POST /upload-profile` (userId undefined)** | ❌ | **ใช่** |
| 7️⃣ | `GET /users/:id` (Member ดูคนอื่น) | ⚠️ | **ต้องชี้แจง** |

---

## 🎯 Priority Fix

**ต้องแก้ด่วน:**
- ❌ ปัญหา #1: `GET /rentals` Information Disclosure
- ❌ ปัญหา #6: `POST /upload-profile` Bug (userId undefined)

**ต้องชี้แจง:**
- ⚠️ ปัญหา #5: due_date logic
- ⚠️ ปัญหา #7: Member เห็นคนอื่นได้ไหม

**ควรปรับปรุง:**
- ⚠️ ปัญหา #4: due_date validation

---

## 📝 หมายเหตุ

- Upload middleware ที่ใช้ `req.user.user_id` สำหรับ folder structure ถูกต้องแล้ว
- Soft Delete pattern (deleted_at) ปฏิบัติดี
- Transaction handling (COMMIT/ROLLBACK) ใช้งานได้ดี
- JWT Token structure ใช้งานได้ดี
