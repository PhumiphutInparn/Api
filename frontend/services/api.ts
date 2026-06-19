import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: any) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const handleError = (error: any) => {
  if (error.response && error.response.data) {
    throw new Error(error.response.data.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
  }
  throw new Error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
};

export const loginAPI = async (email: string, password: string) => {
  try {
    const response = await api.post('/login', { email, password });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const registerAPI = async (data: any) => {
  try {
    const response = await api.post('/register', data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getUserAPI = async (page = 1, limit = 4, search = "", role = "") => {
  try {
    const response = await api.get('/users', {
      params: { page, limit, search, role }
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getUserByIdAPI = async (id: number | string) => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateUserAPI = async (id: number | string, userData: any) => {
  try {
    const response = await api.patch(`/users/edit/${id}`, userData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteUserAPI = async (id: number | string) => {
  try {
    const response = await api.delete(`/users/delete/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const uploadProfileAPI = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    
    const response = await api.post("/upload-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data", 
      },
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getBookAPI = async (page = 1, limit = 8, search = "", status = "") => {
  try {
    const response = await api.get('/books', {
      params: { page, limit, search, status }
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getBookIdAPI = async (id: number | string) => {
  try {
    const response = await api.get(`/books/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const createBookAPI = async (bookData: any) => {
  try {
    const response = await api.post("/books/add", bookData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateBookAPI = async (id: number | string, bookData: any) => {
  try {
    const response = await api.patch(`/books/edit/${id}`, bookData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteBookAPI = async (id: number | string) => {
  try {
    const response = await api.delete(`/books/delete/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getRentalsAPI = async (params?: any) => {
  try {
    const response = await api.get('/rentals', { params });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const borrowBookAPI = async (bookId: number | string) => {
  try {
    const response = await api.post('/rentals/borrow', { book_id: bookId });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateRentalStatusAPI = async (id: number | string, updateData: any) => {
  try {
    const response = await api.patch(`/rentals/update/${id}`, updateData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteRentalAPI = async (id: number | string) => {
  try {
    const response = await api.delete(`/rentals/delete/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export default api;