"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAPI } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const result = await loginAPI(email, password);
      
      // บันทึกข้อมูลลง localStorage
      localStorage.setItem('user_id', result.user_id);
      localStorage.setItem('token', result.token);
      if (result.role) localStorage.setItem('role', result.role);

      
      router.push('/books');
      router.refresh();
    } catch (error: any) {
      setErrorMsg(error.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">เข้าสู่ระบบ</h2>
          <p className="text-gray-500 mt-2 text-sm">ยินดีต้อนรับสู่ระบบยืมหนังสือ</p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all duration-200 text-black placeholder:text-gray-400"
              placeholder="name@mail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all duration-200 text-black placeholder:text-gray-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 ${
              isLoading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-black hover:bg-gray-800 shadow-lg shadow-black/20"
            }`}
          >
            {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ยังไม่มีบัญชี?{" "}
            <a href="/register" className="font-bold text-black hover:underline">
              สมัครสมาชิก
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}