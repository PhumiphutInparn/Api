"use client";

import React, { useEffect, useState } from 'react';
import { getRentalsAPI, updateRentalStatusAPI } from '@/services/api';
import RentalTable from '@/components/rentals/RentalTable';

export default function RentalsPage() {
  const [rentals, setRentals] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // --- State สำหรับ Search & Pagination ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // จำนวนแถวที่จะโชว์ต่อ 1 หน้า

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const res = await getRentalsAPI();
      // เช็กโครงสร้างข้อมูลจาก API ของพี่ให้ตรงกันนะครับ (เช่น res.data หรือ res)
      setRentals(res.data || res || []);
    } catch (err) {
      console.error("Error fetching rentals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. เช็กสิทธิ์ว่าเป็น Admin ไหม
    const role = localStorage.getItem('role');
    setIsAdmin(role === 'admin');
    
    // 2. ดึงข้อมูลประวัติการยืม
    fetchRentals();
  }, []);

  
  const handleUpdateStatus = async (id: number, status: 'returned' | 'lost') => {
    try {
      // ยิงไปที่ /rentals/:id โดยส่ง body เป็น { rental_status: 'lost' หรือ 'returned' }
      await updateRentalStatusAPI(id, { rental_status: status });
      alert("อัปเดตสถานะรายการเรียบร้อยแล้ว!");
      fetchRentals(); // 🚀 รีโหลดตารางใหม่ ข้อมูลจะเปลี่ยนตามหลังบ้านทันที
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  // 🔍 Logic ค้นหา: ค้นจากชื่อหนังสือ หรือ ชื่อ-นามสกุลผู้ยืม (กรณีเป็นแอดมิน)
  const filteredRentals = rentals.filter((item: any) => {
    const search = searchTerm.toLowerCase();
    const bookTitle = item.title?.toLowerCase() || '';
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
    
    return bookTitle.includes(search) || fullName.includes(search);
  });

 
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRentals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRentals.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium animate-pulse">กำลังโหลดข้อมูลประวัติ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ส่วนหัวแผงควบคุมและช่อง Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isAdmin ? "ระบบจัดการการยืม-คืน (Admin)" : "ประวัติการยืมหนังสือของคุณ"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              รวมรายการยืมหนังสือและสถานะการคืนทั้งหมดในระบบ
            </p>
          </div>
          
          {/* ช่องค้นหาดีไซน์เข้าชุด */}
          <div className="w-full sm:w-72">
  <input
    type="text"
    placeholder="ค้นหาหนังสือ หรือชื่อผู้ยืม..."
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
    }}
   
    className="w-full px-5 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all duration-300 text-sm text-black font-medium"
  />
</div>
        </div>

        {/* เรียกใช้งานตารางที่เราแยก Component ไว้ */}
        <RentalTable 
          rentals={currentItems} 
          isAdmin={isAdmin} 
          onUpdateStatus={handleUpdateStatus} 
        />

        {/* ส่วนควบคุม Pagination (โชว์เฉพาะเมื่อมีข้อมูลมากกว่า 1 หน้า) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-black transition-all disabled:opacity-40 disabled:hover:border-gray-200 active:scale-95 cursor-pointer"
            >
              ก่อนหน้า
            </button>
            
            <span className="text-sm font-bold text-gray-800 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm">
              {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-black transition-all disabled:opacity-40 disabled:hover:border-gray-200 active:scale-95 cursor-pointer"
            >
              ถัดไป
            </button>
          </div>
        )}

      </div>
    </div>
  );
}