const express = require('express');
const router = express.Router();
const finesController = require('../controllers/fines');

// GET ดึงข้อมูล fines ทั้งหมด
router.get('/', finesController.get);

// GET ดึงข้อมูล fine ของ user ที่ระบุ
router.get('/user/:user_id', finesController.getUserFines);

// PATCH จ่ายค่าปรับ (Mark as Paid)
router.patch('/pay/:id', finesController.payFine);

// POST ประมวลผล overdue books และสร้าง fines (Cron Job)
router.post('/process-overdue', finesController.processOverdueBooks);

module.exports = router;
