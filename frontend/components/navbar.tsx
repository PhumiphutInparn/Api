"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      setIsLoggedIn(true);
      if (role === 'admin') {
        setIsAdmin(true);
      }
    }
  }, []);

  const handleLogout = () => { 
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id'); // ลบ user_id ด้วยเพื่อความชัวร์
    
    setIsLoggedIn(false);
    setIsAdmin(false);
    
    alert('ออกจากระบบเรียบร้อยแล้ว');
    router.push('/login'); 
  };
  
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex items-center gap- 3">
            <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
            </svg>
            <Link href="/books" className="text-2xl font-bold text-gray-900 tracking-tight">
              ยืม Nung สือ
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/books" className="text-gray-600 hover:text-black font-medium text-sm transition-colors">
              รายการหนังสือ
            </Link>

            {isLoggedIn && (
              <>
                <Link href="/rentals" className="text-gray-600 hover:text-black font-medium text-sm transition-colors">
                  ประวัติการยืม
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-black font-medium text-sm transition-colors">
                  โปรไฟล์
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/users" className="text-gray-600 hover:text-black font-medium text-sm transition-colors">
                  จัดการ User
                </Link>
                {/* ปุ่มเพิ่มหนังสือสำหรับ Admin */}
                <Link 
                  href="/books/add" 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  + เพิ่มหนังสือ
                </Link>
              </>
            )}

            {isLoggedIn ? (
              <button 
                onClick={handleLogout}
                className="border border-gray-300 text-gray-800 hover:border-black hover:text-black px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                ออกจากระบบ
              </button>
            ) : (
              <Link 
                href="/login"
                className="bg-black text-white hover:bg-gray-800 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-2">
          <Link href="/books" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-gray-700">รายการหนังสือ</Link>
          {isLoggedIn && (
            <>
              <Link href="/rentals" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-gray-700">ประวัติการยืม</Link>
              <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-gray-700">โปรไฟล์</Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link href="/users" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-gray-700">จัดการ User</Link>
              <Link href="/books/add" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-emerald-600 font-bold">+ เพิ่มหนังสือ</Link>
            </>
          )}
          {isLoggedIn ? (
            <button onClick={handleLogout} className="w-full text-left py-3 text-red-600">ออกจากระบบ</button>
          ) : (
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-black font-bold">เข้าสู่ระบบ</Link>
          )}
        </div>
      )}
    </nav>
  );
}