import React from 'react';

interface Book {
  book_id: number;
  title: string;
  author: string;
  isbn: string;
  status: 'available' | 'rented' | 'lost';
}

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onSave: (updatedBook: Book) => void;
}

export default function EditBookModal({ isOpen, onClose, book, onSave }: EditBookModalProps) {
  const [editedBook, setEditedBook] = React.useState<Book | null>(book);

  React.useEffect(() => {
    setEditedBook(book);
  }, [book]);

  if (!isOpen || !editedBook) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4">แก้ไขข้อมูลหนังสือ</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อหนังสือ</label>
            <input 
              type="text" 
              value={editedBook.title}
              onChange={(e) => setEditedBook({...editedBook, title: e.target.value})}
              className="w-full border rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อผู้แต่ง</label>
            <input 
              type="text" 
              value={editedBook.author}
              onChange={(e) => setEditedBook({...editedBook, author: e.target.value})}
              className="w-full border rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-black outline-none"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2 border rounded-xl hover:bg-gray-50">ยกเลิก</button>
            <button 
              onClick={() => onSave(editedBook)}
              className="flex-1 py-2 bg-black text-white rounded-xl hover:bg-gray-800"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}