"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerAPI } from '@/services/api';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // ตรวจสอบว่า registerAPI ของพี่รับค่าเป็น Object หรือ Argument แยก
      await registerAPI(formData);
      
      setSuccessMsg('สมัครสมาชิกสำเร็จ! กำลังไปหน้าเข้าสู่ระบบ...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  // สร้างฟังก์ชันช่วยทำ Input ให้โค้ดสะอาดขึ้น
  const renderInput = (label: string, name: string, type: string, placeholder: string) => (
    <div className="relative group">
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 transition-colors group-focus-within:text-black">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required
        value={formData[name as keyof typeof formData]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all duration-300 placeholder:text-gray-300 text-gray-900"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">สร้างบัญชีผู้ใช้</h1>
          <p className="text-gray-400 mt-2 text-sm">เริ่มต้นการยืมหนังสือที่สะดวกที่สุด</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-sm text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {renderInput("ชื่อจริง", "first_name", "text", "สมชาย")}
            {renderInput("นามสกุล", "last_name", "text", "ใจดี")}
          </div>
          
          {renderInput("อีเมล", "email", "email", "example@mail.com")}
          {renderInput("รหัสผ่าน", "password", "password", "••••••••")}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-[0.98] ${
              loading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-black hover:bg-gray-800 shadow-xl shadow-black/20'
            }`}
          >
            {loading ? 'กำลังดำเนินการ...' : 'ลงทะเบียน'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="font-bold text-black hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}