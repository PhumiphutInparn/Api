"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserAPI, updateUserAPI } from '@/services/api'; 
import UserTable from '@/components/users/UserTable';

interface UserData {
  user_id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at?: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // --- State สำหรับ Search & Pagination ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // แสดงผลหน้าละ 8 รายการ

  // --- State สำหรับ Modal แก้ไขข้อมูล User ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // 💡 ปรับการดึงข้อมูล: ใส่ Parameter เพื่อบังคับดึงข้อมูลผู้ใช้ทั้งหมดออกมา (คล้ายหน้า Books)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // ตรงนี้ผมปรับให้ส่งค่า (1, 100) หรือส่งดักไว้ เพื่อให้ API หลังบ้านส่งข้อมูลมาทั้งหมด ไม่ล็อกแค่คนเดียว
      const res = await getUserAPI(1, 100, "", ""); 
      
      console.log("เช็กผลลัพธ์ดึงข้อมูลผู้ใช้ทั้งหมดจาก API:", res);
      
      // ดักจับโครงสร้างข้อมูลจาก Backend ทุกรูปแบบยอดนิยม
      if (res && Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res && res.data && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else if (Array.isArray(res)) {
        setUsers(res);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/books');
      return;
    }
    fetchUsers();
  }, [router]);

  // เปิด Modal และคัดลอกข้อมูลเก่าลง State
  const handleOpenEditModal = (user: UserData) => {
    setSelectedUser({ ...user });
    setIsModalOpen(true);
  };

  // บันทึกการแก้ไขรายละเอียดและสิทธิ์
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSaveLoading(true);
      await updateUserAPI(selectedUser.user_id, {
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        email: selectedUser.email,
        role: selectedUser.role,
      });
      alert("อัปเดตข้อมูลผู้ใช้งานสำเร็จ!");
      setIsModalOpen(false);
      fetchUsers(); // โหลดข้อมูลสดใหม่จากหลังบ้านทันที
    } catch (err) {
      alert("เกิดข้อผิดพลาด ไม่สามารถแก้ไขข้อมูลได้");
    } finally {
      setSaveLoading(false);
    }
  };

  // 🔍 Logic ค้นหาฉบับแก้ไข: ป้องกันการเออร์เรอร์ค่าว่าง ค้นเจอทั้งชื่อพิมพ์เล็ก/ใหญ่ และอีเมล
  const filteredUsers = users.filter((user: any) => {
    if (!user) return false;
    
    const search = searchTerm.toLowerCase().trim();
    const firstName = (user.first_name || '').toLowerCase();
    const lastName = (user.last_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    
    return (
      firstName.includes(search) || 
      lastName.includes(search) || 
      `${firstName} ${lastName}`.includes(search) ||
      email.includes(search)
    );
  });

  // 📄 คำนวณหน้า Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium animate-pulse">กำลังโหลดข้อมูลผู้ใช้งานทั้งหมด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ส่วนหัวแผงควบคุมหลัก */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">ระบบจัดการผู้ใช้งาน (Admin)</h1>
            <p className="text-gray-400 text-sm mt-1">ตรวจสอบรายชื่อสมาชิกและแก้ไขรายละเอียดสิทธิ์ในระบบ</p>
          </div>
          
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรืออีเมล..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // พิมพ์ค้นหาแล้วให้เด้งกลับหน้า 1 เสมอ
              }}
              className="w-full px-5 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all duration-300 text-sm text-black font-medium"
            />
          </div>
        </div>

        {/* ตารางสมาชิก */}
        <UserTable users={currentItems} onOpenEditModal={handleOpenEditModal} />

        {/* แผงปุ่ม Pagination (แสดงหมายเลขหน้า) */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-black transition-all disabled:opacity-40 disabled:hover:border-gray-200 active:scale-95 cursor-pointer"
          >
            ก่อนหน้า
          </button>
          
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer border ${
                currentPage === number
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-black'
              }`}
            >
              {number}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-black transition-all disabled:opacity-40 disabled:hover:border-gray-200 active:scale-95 cursor-pointer"
          >
            ถัดไป
          </button>
        </div>

      </div>

      {/* ================= กล่อง MODAL จัดการรายละเอียด USER สไตล์พรีเมียม ================= */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-100 p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">แก้ไขข้อมูลสมาชิก</h2>
            <p className="text-gray-400 text-xs mb-6">ID ผู้ใช้งาน: {selectedUser.user_id}</p>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">ชื่อจริง</label>
                  <input
                    type="text"
                    required
                    value={selectedUser.first_name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm font-medium focus:bg-white focus:border-black outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={selectedUser.last_name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm font-medium focus:bg-white focus:border-black outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">อีเมลแอดเดรส</label>
                <input
                  type="email"
                  required
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black text-sm font-medium focus:bg-white focus:border-black outline-none transition-all"
                />
              </div>

              {/* 💡 ตกแต่งช่อง Select Role แบบโมเดิร์นตามที่ขอมาครับ */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">บทบาทสิทธิ์ (Role)</label>
                <div className="relative">
                  <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-black text-sm font-semibold focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all duration-300 appearance-none cursor-pointer"
                  >
                    <option value="member" className="text-gray-900 font-medium bg-white py-2">Member (ผู้ใช้งานทั่วไป)</option>
                    <option value="admin" className="text-purple-600 font-bold bg-white py-2">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3 border border-gray-200 hover:border-black text-gray-700 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-1/2 py-3 bg-black hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all active:scale-95 disabled:bg-gray-400 cursor-pointer shadow-lg shadow-black/10"
                >
                  {saveLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}