import axios from 'axios';

// (Instance) และตั้งค่า URL เริ่มต้นของ Backend
const api = axios.create({
  baseURL: 'http://localhost:3000', //พอร์ต Backend ของพี่
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor: ด่านตรวจ "ก่อน" ยิง API ทุกครั้ง
api.interceptors.request.use(
  (config) => {
    // เช็ก typeof window เพื่อป้องกัน Error ฝั่ง Server (เพราะ Next.js มีการเรนเดอร์ 2 ฝั่ง)
    if (typeof window !== 'undefined') {
      // ไปงัดเอา Token ที่เก็บไว้ในเครื่องออกมา
      const token = localStorage.getItem('token');
      
      // ถ้ามี Token ก็เอาไปเสียบใส่ช่อง Authorization ให้เลยอัตโนมัติ!
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ด่านตรวจตอนรับข้อมูลกลับมา
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token'); // ลบของเก่าทิ้ง
        window.location.href = '/login'; // เตะกลับหน้า Login
      }
    }
    return Promise.reject(error);
  }
);

export default api;