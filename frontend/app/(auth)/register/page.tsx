'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api'; // ปรับพาธให้ตรงกับโฟลเดอร์ services ของพี่
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  
  // 1. สร้าง State เก็บข้อมูลจากฟอร์ม
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  // 2. สร้าง State เก็บสถานะการโหลดและข้อความแจ้งเตือน
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ฟังก์ชันอัปเดตข้อมูลเวลาผู้ใช้พิมพ์
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ฟังก์ชันเมื่อกดยืนยันสมัครสมาชิก
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ป้องกันเว็บรีเฟรช
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 🚀 ยิงข้อมูลไปหา API หลังบ้าน (เช็ก URL เส้นทางให้ตรงกับ routes ของพี่นะครับ)
      const response = await api.post('/register', formData);
      
      if (response.status === 201) {
        setSuccessMsg('สมัครสมาชิกสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...');
        
        // หน่วงเวลา 2 วินาทีให้ผู้ใช้อ่านข้อความ แล้วเตะไปหน้า Login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      // ดักจับ Error จากที่หลังบ้านส่งมา (เช่น อีเมลซ้ำ)
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // พื้นหลังสีเทาอ่อน จัดให้อยู่กึ่งกลางหน้าจอ
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      
      {/* กล่อง Card สีขาว */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">สมัครสมาชิก</h1>
          <p className="text-gray-500 text-sm mt-2">กรอกข้อมูลเพื่อเข้าร่วมระบบยืม-คืนหนังสือ</p>
        </div>

        {/* โซนแสดงข้อความแจ้งเตือน (เขียว/แดง) */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-lg text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-100 text-green-600 text-sm rounded-lg text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* แถว ชื่อ-นามสกุล (แบ่งครึ่งซ้ายขวา) */}
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อจริง</label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="สมชาย"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="ใจดี"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* ปุ่ม Submit ที่เปลี่ยนสีและข้อความได้ตอนกำลังโหลด */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-semibold transition-all ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {loading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          มีบัญชีอยู่แล้วใช่ไหม?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}