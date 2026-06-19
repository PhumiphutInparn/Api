"use client";

import React from 'react';

// กำหนดประเภทสิทธิ์ให้กับ Props
interface RentalStatusProps {
  status: 'active' | 'returned' | 'overdue' | 'lost' | string;
}

export default function RentalStatus({ status }: RentalStatusProps) {
  
  const statusStyles: Record<string, string> = {
    active: 'bg-blue-50 text-blue-600 border-blue-100',
    returned: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    overdue: 'bg-rose-50 text-rose-600 border-rose-100 font-bold animate-pulse', // ค้างส่งให้กะพริบเบาๆ ดึงสายตา
    lost: 'bg-gray-100 text-gray-600 border-gray-200 line-through',
  };

  
  const statusLabels: Record<string, string> = {
    active: 'กำลังยืม',
    returned: 'คืนแล้ว',
    overdue: 'เกินกำหนดส่ง',
    lost: 'หนังสือสูญหาย',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
      statusStyles[status] || 'bg-gray-50 text-gray-500 border-gray-200'
    }`}>
      {statusLabels[status] || status}
    </span>
  );
}