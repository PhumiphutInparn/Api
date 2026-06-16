'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/api';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  //  ดึงหนังสือออกจากตะกร้า (localStorage) มาโชว์ตอนเปิดหน้า
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('bookCart') || '[]');
    setCartItems(savedCart);
  }, []);

  //  ฟังก์ชันลบหนังสือออกจากตะกร้า (เผื่อผู้ใช้เปลี่ยนใจ)
  const handleRemove = (bookIdToRemove) => {
    const updatedCart = cartItems.filter(item => (item.id || item.book_id) !== bookIdToRemove);
    setCartItems(updatedCart);
    localStorage.setItem('bookCart', JSON.stringify(updatedCart)); // อัปเดตตะกร้า
  };

  //  ฟังก์ชันไฮไลต์: ยืนยันการยืมพร้อมกันหลายเล่ม 
  const handleCheckout = async () => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // ใช้ Promise.all เพื่อยิง API คำขอทีละเล่ม แต่รัน "พร้อมกันทั้งหมด" รวดเดียว!
      // (เพื่อให้หลังบ้านรับข้อมูลได้ตามลอจิกเดิมเป๊ะๆ)
      const requestPromises = cartItems.map(book => 
        api.post('/rentals/request', { book_id: book.id || book.book_id })
      );

      await Promise.all(requestPromises); // รอจนกว่าทุกเล่มจะยิงคำขอเสร็จ

      setMessage({ type: 'success', text: 'ส่งคำขอยืมหนังสือสำเร็จทั้งหมด! รอแอดมินอนุมัติครับ' });
      
      // ล้างตะกร้าทิ้ง เพราะทำเรื่องขอยืมไปหมดแล้ว
      localStorage.removeItem('bookCart');
      setCartItems([]);

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งคำขอ บางเล่มอาจถูกยืมไปแล้ว' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🛒 ตะกร้าการยืมของฉัน</h1>
          <Link href="/books" className="text-blue-600 hover:underline">
            + เลือกหนังสือเพิ่ม
          </Link>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg text-center font-medium ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
            ตะกร้าว่างเปล่า ลองไปเลือกหนังสือที่น่าสนใจดูสิ!
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {cartItems.map((book) => (
                <li key={book.id || book.book_id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-20 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">
                      [ปก]
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{book.title || book.book_name}</h3>
                      <p className="text-sm text-gray-500">{book.category || 'ทั่วไป'}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleRemove(book.id || book.book_id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    ลบออก
                  </button>
                </li>
              ))}
            </ul>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-gray-600">จำนวนทั้งหมด: <strong className="text-gray-900">{cartItems.length} เล่ม</strong></span>
              
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
                  isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'กำลังส่งคำร้อง...' : '🤝 ยืนยันส่งคำขอยืมทั้งหมด'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}