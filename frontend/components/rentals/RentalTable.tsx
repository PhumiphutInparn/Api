"use client";

import React from 'react';
import RentalStatus from './RentalStatus';

interface RentalItem {
  rental_id: number;
  title: string;
  rental_date: string;
  first_name?: string;
  last_name?: string;
  status: string;
  overdue_days?: number;
}

interface RentalTableProps {
  rentals: RentalItem[];
  isAdmin: boolean;
  onUpdateStatus: (id: number, status: 'returned' | 'lost') => void;
}

export default function RentalTable({ rentals, isAdmin, onUpdateStatus }: RentalTableProps) {
  
  // ถ้าตารางว่างเปล่า (เช่น ผลการค้นหาไม่เจอ)
  if (rentals.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-gray-400 text-sm font-medium">ไม่พบรายการประวัติการยืม-คืนหนังสือ</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/40 border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/70 text-gray-400 uppercase text-xs font-bold tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-5">ชื่อหนังสือ</th>
              <th className="px-6 py-5">วันที่ยืม</th>
              {isAdmin && <th className="px-6 py-5">ผู้ยืมหนังสือ</th>}
              <th className="px-6 py-5">สถานะ</th>
              <th className="px-6 py-5">ค้างส่ง (วัน)</th>
              {isAdmin && <th className="px-6 py-5 text-center">การจัดการ</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {rentals.map((item) => (
              <tr key={item.rental_id} className="hover:bg-gray-50/80 transition-colors duration-200">
                {/* ชื่อหนังสือ */}
                <td className="px-6 py-4.5 font-bold text-gray-900">{item.title}</td>
                
                {/* วันที่ยืม */}
                <td className="px-6 py-4.5 text-gray-500 font-medium" suppressHydrationWarning>
              {item.rent_date ? new Date(item.due_date).toLocaleDateString('th-TH', {
              year: 'numeric',
            month: 'short',
            day: 'numeric'
            }) : '-'}
            </td>
                
                {/* ผู้ยืม (แสดงเฉพาะแอดมิน) */}
                {isAdmin && (
                  <td className="px-6 py-4.5 text-gray-600 font-medium">
                    {item.first_name} {item.last_name}
                  </td>
                )}
                
                {/* ส่วนของ Badge สถานะ */}
                <td className="px-6 py-4.5">
                  <RentalStatus status={item.status} />
                </td>
                
                {/* จำนวนวันค้างส่ง */}
                <td className="px-6 py-4.5">
                  {item.overdue_days && item.overdue_days > 0 ? (
                    <span className="text-rose-600 font-extrabold">{item.overdue_days} วัน</span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                
                {/* ปุ่มจัดการสำหรับแอดมิน (คุมธีมกลมมน สวยงาม) */}
                {isAdmin && (
                  <td className="px-6 py-4.5">
                    <div className="flex justify-center gap-2">
                      {item.status !== 'returned' && item.status !== 'lost' ? (
                        <>
                          <button
                            onClick={() => onUpdateStatus(item.rental_id, 'returned')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-sm shadow-emerald-600/10 cursor-pointer"
                          >
                            คืนหนังสือ
                          </button>
                          <button
                            onClick={() => onUpdateStatus(item.rental_id, 'lost')}
                            className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 cursor-pointer"
                          >
                            ทำหาย
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">จัดการแล้ว</span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}