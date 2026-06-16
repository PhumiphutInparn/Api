'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api'; // ปรับพาธให้ตรงกับโฟลเดอร์ของพี่
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  
  // State เก็บข้อมูลแค่อีเมลกับรหัสผ่าน
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ฟังก์ชันอัปเดตข้อมูลเวลาพิมพ์ (ถ้าพี่ใช้ .js ธรรมดา ให้ลบ : React.ChangeEvent<HTMLInputElement> ออกนะครับ)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ฟังก์ชันกดยืนยันเข้าสู่ระบบ (ถ้าพี่ใช้ .js ธรรมดา ให้ลบ : React.FormEvent ออกนะครับ)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 🚀 ยิงข้อมูลไปเช็กที่เส้นทาง /login
      const response = await api.post('/login', formData);
      
      if (response.status === 200) {
        setSuccessMsg('เข้าสู่ระบบสำเร็จ! กำลังพาท่านเข้าสู่ระบบ...');
        
        // 💡 ไฮไลต์สำคัญ: เอา Token ที่หลังบ้านส่งมา เก็บใส่กระเป๋า (localStorage)
        // เพื่อให้ไฟล์ api.ts ของเราดึงไปใช้โชว์ รปภ. ในหน้าอื่นๆ ได้อัตโนมัติ
        localStorage.setItem('token', response.data.token);
        
        // หน่วงเวลา 1.5 วินาที แล้วเตะไปหน้าดูหนังสือ (หรือหน้า Home ที่พี่ต้องการ)
        setTimeout(() => {
          router.push('/books'); 
        }, 1500);
      }
    } catch (err: any) {
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.message); // โชว์ข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
      } else {
        setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
          <p className="text-gray-500 text-sm mt-2">ยินดีต้อนรับกลับสู่ระบบยืม-คืนหนังสือ</p>
        </div>

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

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-semibold transition-all ${
              loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ยังไม่มีบัญชีใช่ไหม?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            สมัครสมาชิกใหม่
          </Link>
        </p>
      </div>
    </div>
  );
}