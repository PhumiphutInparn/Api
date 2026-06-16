'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../services/api';
import Link from 'next/link';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ดึงข้อมูลหนังสือเหมือนเดิม
  useEffect(() => {
    const fetchBookDetail = async () => {
      try {
        const response = await api.get(`/book/${bookId}`);
        setBook(response.data.data || response.data);
        console.log("🔍 ข้อมูลหนังสือที่ดึงมาได้:", bookData);
        setBook(bookData);
      } catch (err) {
        setMessage({ type: 'error', text: 'ไม่สามารถดึงข้อมูลหนังสือเล่มนี้ได้' });
      } finally {
        setLoading(false);
      }
    };
    if (bookId) fetchBookDetail();
  }, [bookId]);

  // ฟังก์ชันใหม่: แค่เก็บใส่ localStorage ยังไม่ยิง API
  const handleAddToCart = () => {
    // ไปดึงตะกร้าเก่าออกมาดูว่ามีอะไรอยู่ไหม
    const existingCart = JSON.parse(localStorage.getItem('bookCart') || '[]');
    // เช็กว่าเล่มนี้เคยหยิบใส่ตะกร้าไปหรือยัง
    const isAlreadyInCart = existingCart.find(item => item.id === book.id || item.id === book.book_id);
    
    if (isAlreadyInCart) {
      setMessage({ type: 'error', text: 'หนังสือเล่มนี้อยู่ในตะกร้าของคุณแล้ว!' });
      return;
    }

    // ถ้ายังไม่เคยหยิบ ก็จับยัดใส่ตะกร้า
    const newCart = [...existingCart, book];
    localStorage.setItem('bookCart', JSON.stringify(newCart));
    
    setMessage({ type: 'success', text: 'เพิ่มหนังสือลงตะกร้าสำเร็จ!' });
    
    // เด้งไปหน้าตะกร้า หรือจะให้อยู่หน้าเดิมก็ได้ (อันนี้พาไปหน้าตะกร้าเลย)
    setTimeout(() => {
      router.push('/cart');
    }, 1000);
  };

  if (loading) return <div className="text-center mt-20">กำลังโหลดรายละเอียด...</div>;
  if (!book) return <div className="text-center mt-20 text-red-500">ไม่พบข้อมูลหนังสือ</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 p-8 gap-8">
        
        <div className="bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 h-96 md:h-full">
          [ รูปหน้าปก ]
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <Link href="/books" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
              ← กลับไปห้องสมุด
            </Link>
            <h1 className="text-3xl font-bold mt-2">{book.title || book.book_name}</h1>
            <p className="text-sm text-gray-500 mt-1">หมวดหมู่: {book.category || 'ทั่วไป'}</p>
          </div>

          <div className="mt-8">
            {message.text && (
              <div className={`mb-4 p-3 text-sm rounded-lg text-center ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* ปุ่มเปลี่ยนหน้าที่เป็น หยิบใส่ตะกร้า */}
            {(book.status === 'available' || book.status === 'ว่าง') ? (
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
              >
                หยิบใส่ตะกร้าการยืม
              </button>
            ) : (
              <button disabled className="w-full py-3 bg-gray-200 text-gray-500 font-semibold rounded-xl cursor-not-allowed">
                ไม่สามารถยืมได้ในขณะนี้
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}