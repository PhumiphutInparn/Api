'use client';

import { useEffect, useState } from 'react';
import { getBookAPI, borrowBookAPI } from '../../services/api';
import { useRouter } from 'next/navigation';
import EditBookModal from '../../components//Books/EditBookModal';

interface BookData {
  book_id: number;
  title: string;
  author: string;
  isbn: string;
  status: 'available' | 'rented' | 'lost';
}

export default function BooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'available'>('all');
  

  const fetchBooks = async () => {
    try {
      const rawData = await getBookAPI(1, 100, "", "");
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

  const handleBorrow = async (bookId: number) => {
    try {
      const response = await borrowBookAPI(bookId);
      if (response && !response.error) {
       
       
        alert("ยืมหนังสือสำเร็จ! ระบบกำหนดส่งคืนภายใน 7 วัน");
       
        router.push('/rentals');
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.book_id === bookId ? { ...book, status: 'rented' } : book
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการยืม");
    }
  };

  const displayedBooks = books.filter((book) => {
    if (filter === 'available') return book.status === 'available';
    return true;
  });

  if (loading) return <div className="text-center mt-20">กำลังโหลดข้อมูลหนังสือ...</div>;
  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
          
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            หนังสือทั้งหมด ({books.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'available' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            พร้อมให้ยืม ({books.filter((b) => b.status === 'available').length})
          </button>
        </div>

        {displayedBooks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-sm">ไม่พบหนังสือในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedBooks.map((book) => (
              <div key={book.book_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                <div className="relative h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                  <img src="book.png" alt={book.title} className="w-full h-full object-contain p-2" />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm ${
                        book.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : book.status === 'rented'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {book.status === 'available' ? 'ว่าง' : book.status === 'rented' ? 'ถูกยืมแล้ว' : 'สูญหาย'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-bold text-gray-900 line-clamp-1">
                      {book.title}
                    </h2>
                    <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>
                  </div>

                  <div>
                    {book.status !== 'available' ? (
                      <button
                        disabled
                        className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed border border-gray-200"
                      >
                        {book.status === 'rented' ? 'ถูกยืมไปแล้ว' : 'หนังสือสูญหาย'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBorrow(book.book_id)}
                        className="w-full bg-black text-white hover:bg-gray-800 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                      >
                        กดยืมหนังสือ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}