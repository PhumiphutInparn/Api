#!/bin/bash

# 📋 Library API - Complete Testing Script
# ยิง API ทั้งหมด 24 endpoints

BASE_URL="http://localhost:3000"

echo "================================"
echo "🧪 Library API Testing Script"
echo "================================"
echo ""

# ==================== A. AUTHENTICATION ====================
echo "📌 A. AUTHENTICATION"
echo "---"

echo "1️⃣ Register New User"
curl -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'
echo -e "\n---\n"

echo "2️⃣ Login"
curl -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student01@rmutt.ac.th",
    "password": "123456"
  }'
echo -e "\n---\n"

# ==================== B. USER MANAGEMENT ====================
echo "📌 B. USER MANAGEMENT"
echo "---"

echo "3️⃣ Get All Users"
curl -X GET "$BASE_URL/users?page=1&limit=5" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "4️⃣ Search Users"
curl -X GET "$BASE_URL/users?search=test&page=1&limit=5" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "5️⃣ Update User (ID: 11)"
curl -X PATCH $BASE_URL/users/11 \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "first_name": "Super"
  }'
echo -e "\n---\n"

echo "6️⃣ Delete User (ID: 1)"
curl -X DELETE $BASE_URL/users/1 \
  -H "Content-Type: application/json"
echo -e "\n---\n"

# ==================== C. BOOK MANAGEMENT ====================
echo "📌 C. BOOK MANAGEMENT"
echo "---"

echo "7️⃣ Get All Books"
curl -X GET "$BASE_URL/book/" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "8️⃣ Get All Books with Pagination"
curl -X GET "$BASE_URL/book?page=1&limit=2" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "9️⃣ Search Books"
curl -X GET "$BASE_URL/book?search=Python&status=available" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "🔟 Get Single Book (ID: 1)"
curl -X GET "$BASE_URL/book/1" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "1️⃣1️⃣ Add New Book"
curl -X POST $BASE_URL/book/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Node.js",
    "author": "Expert Programmer",
    "isbn": "978-1-1111-1111-1"
  }'
echo -e "\n---\n"

echo "1️⃣2️⃣ Update Book Status (ID: 6)"
curl -X POST $BASE_URL/book/update/6 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "available"
  }'
echo -e "\n---\n"

echo "1️⃣3️⃣ Delete Book (ID: 1)"
curl -X DELETE $BASE_URL/book/delete/1 \
  -H "Content-Type: application/json"
echo -e "\n---\n"

# ==================== D. RENTAL MANAGEMENT ====================
echo "📌 D. RENTAL MANAGEMENT"
echo "---"

echo "1️⃣4️⃣ Get All Rentals"
curl -X GET "$BASE_URL/rentals?page=1&limit=10" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "1️⃣5️⃣ Filter Rentals by User"
curl -X GET "$BASE_URL/rentals?user_id=2&status=active" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "1️⃣6️⃣ Borrow Book (Create Rental)"
curl -X POST $BASE_URL/rentals \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "book_id": 3
  }'
echo -e "\n---\n"

echo "1️⃣7️⃣ Return Book (Update Rental ID: 1)"
curl -X PATCH $BASE_URL/rentals/1 \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "1️⃣8️⃣ Delete Rental (ID: 2)"
curl -X DELETE $BASE_URL/rentals/2 \
  -H "Content-Type: application/json"
echo -e "\n---\n"

# ==================== E. FINE MANAGEMENT ====================
echo "📌 E. FINE MANAGEMENT"
echo "---"

echo "1️⃣9️⃣ Get All Fines"
curl -X GET "$BASE_URL/fines?page=1&limit=10" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "2️⃣0️⃣ Get Fines by User (ID: 1)"
curl -X GET "$BASE_URL/fines/user/1" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "2️⃣1️⃣ Pay Fine (ID: 1)"
curl -X PATCH $BASE_URL/fines/pay/1 \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "2️⃣2️⃣ Process Overdue Books (Cron Job)"
curl -X POST $BASE_URL/fines/process-overdue \
  -H "Content-Type: application/json"
echo -e "\n---\n"

# ==================== F. BULK OPERATIONS ====================
echo "📌 F. BULK OPERATIONS"
echo "---"

echo "2️⃣3️⃣ Bulk Add Users"
curl -X POST $BASE_URL/bulk/users \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "email": "bulk1@test.com",
        "password": "pass123",
        "first_name": "BulkUser1",
        "last_name": "Test"
      },
      {
        "email": "bulk2@test.com",
        "password": "pass123",
        "first_name": "BulkUser2",
        "last_name": "Test"
      }
    ]
  }'
echo -e "\n---\n"

echo "2️⃣4️⃣ Bulk Add Books"
curl -X POST $BASE_URL/bulk/books \
  -H "Content-Type: application/json" \
  -d '{
    "books": [
      {
        "title": "Bulk Book 1",
        "author": "Author One",
        "isbn": "999-1001"
      },
      {
        "title": "Bulk Book 2",
        "author": "Author Two",
        "isbn": "999-1002"
      },
      {
        "title": "Bulk Book 3",
        "author": "Author Three",
        "isbn": "999-1003"
      }
    ]
  }'
echo -e "\n---\n"

echo "2️⃣5️⃣ Bulk Add Rentals"
curl -X POST $BASE_URL/bulk/rentals \
  -H "Content-Type: application/json" \
  -d '{
    "rentals": [
      {
        "user_id": 2,
        "book_id": 4
      },
      {
        "user_id": 3,
        "book_id": 5
      }
    ]
  }'
echo -e "\n---\n"

echo "2️⃣6️⃣ Bulk Delete Users"
curl -X POST $BASE_URL/bulk/delete-users \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [10, 11, 12]
  }'
echo -e "\n---\n"

echo "2️⃣7️⃣ Bulk Delete Books"
curl -X POST $BASE_URL/bulk/delete-books \
  -H "Content-Type: application/json" \
  -d '{
    "book_ids": [7, 8, 9]
  }'
echo -e "\n---\n"

# ==================== SUMMARY ====================
echo "================================"
echo "✅ ทดสอบเสร็จสิ้น!"
echo "================================"
echo "รวม: 27 API endpoints ทดสอบ"
echo "A. Authentication: 2"
echo "B. User Management: 4"
echo "C. Book Management: 7"
echo "D. Rental Management: 5"
echo "E. Fine Management: 4"
echo "F. Bulk Operations: 5"
echo "================================"
