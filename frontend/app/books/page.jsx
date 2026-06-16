'use client';

import { useEffect, useState } from 'react';
import api from '../../services/api';
import Link from 'next/link';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBooks = async () => {
    try {
      const response = await api.get('/book'); 
      const rawData = response.data;
      
      if (Array.isArray(rawData)) {
        setBooks(rawData);
      } else if (rawData && Array.isArray(rawData.data)) {
        setBooks(rawData.data);
      } else {
        setBooks([]);
      }
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลหนังสือได้ หรือ Token อาจหมดอายุ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // ฟังก์ชันช่วยแปลงสถานะเป็นข้อความและสี Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
      case 'ว่าง':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">🟢 ว่าง</span>;
      case 'pending':
      case 'รออนุมัติ':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">🟡 รอแอดมินอนุมัติ</span>;
      case 'borrowed':
      case 'ถูกยืม':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">🔴 ถูกยืมแล้ว</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">ไม่ทราบสถานะ</span>;
    }
  };

  if (loading) return <div className="text-center mt-20">กำลังโหลดข้อมูลหนังสือ...</div>;
  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">ห้องสมุดของเรา</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {Array.isArray(books) && books.length > 0 ? (
            books.map((book) => (
              <div key={book.id || book.book_id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400 relative">
                    [รูปหน้าปกหนังสือ]
                    {/* 💡 แสดงสถานะหัวมุมขวาของรูป */}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(book.status)}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-800 truncate">
                      {book.title || book.book_name || 'ชื่อหนังสือ'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">หมวดหมู่: {book.category || 'ทั่วไป'}</p>
                  </div>
                </div>
                
                <div className="p-4 pt-0">
                  <Link 
                    href={`/books/${book.id || book.book_id}`} 
                    className="inline-block w-full text-center bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ดูรายละเอียด / ขอยืม
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-10">
              ยังไม่มีหนังสือในระบบ
            </div>
          )}

        </div>
      </div>
    </div>
  );
}