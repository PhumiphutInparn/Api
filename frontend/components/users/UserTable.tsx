"use client";

import React from 'react';

interface UserItem {
  user_id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at?: string;
}

interface UserTableProps {
  users: UserItem[];
  onOpenEditModal: (user: UserItem) => void; // 💡 ปรับมารับ Event เปิดกาง Modal แมนนวล
}

export default function UserTable({ users, onOpenEditModal }: UserTableProps) {
  
  if (users.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-gray-400 text-sm font-medium">ไม่พบข้อมูลสมาชิกในระบบ</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/40 border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/70 text-gray-400 uppercase text-xs font-bold tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-5">ชื่อ - นามสกุล</th>
              <th className="px-6 py-5">อีเมล</th>
              <th className="px-6 py-5">วันที่สมัคร</th>
              <th className="px-6 py-5">บทบาท (Role)</th>
              <th className="px-6 py-5 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50/80 transition-colors duration-200">
                <td className="px-6 py-4.5 font-bold text-gray-900">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-6 py-4.5 text-gray-500 font-medium">
                  {user.email}
                </td>
                <td className="px-6 py-4.5 text-gray-400 text-xs">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}
                </td>
                <td className="px-6 py-4.5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    user.role === 'admin' 
                      ? 'bg-purple-50 text-purple-600 border-purple-100' 
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {user.role === 'admin' ? 'Administrator' : 'Member'}
                  </span>
                </td>
                <td className="px-6 py-4.5 text-center">
                  {/* ปุ่มนี้จะส่งค่า Object ของ User ทั้งคนย้อนกลับไปให้หน้าหลักเปิด Modal ขึ้นมา */}
                  <button
                    onClick={() => onOpenEditModal(user)}
                    className="text-xs font-bold px-4 py-2 bg-gray-50 hover:bg-black hover:text-white border border-transparent rounded-xl transition-all transform active:scale-95 cursor-pointer shadow-sm"
                  >
                    จัดการข้อมูล
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}