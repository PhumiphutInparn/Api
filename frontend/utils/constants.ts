// API Configuration
export const API_BASE_URL = 'http://localhost:3000';

// Status Colors & Badges
export const STATUS_CONFIG = {
  available: {
    badge: '🟢 ว่าง',
    color: 'bg-green-100 text-green-700',
    label: 'ว่าง',
  },
  pending: {
    badge: '🟡 รอแอดมิน',
    color: 'bg-yellow-100 text-yellow-700',
    label: 'รอแอดมินอนุมัติ',
  },
  rented: {
    badge: '🔴 ถูกยืม',
    color: 'bg-red-100 text-red-700',
    label: 'ถูกยืมแล้ว',
  },
  active: {
    badge: '🟢 กำลังยืม',
    color: 'bg-green-100 text-green-700',
    label: 'กำลังยืม',
  },
  returned: {
    badge: '✓ คืนแล้ว',
    color: 'bg-gray-100 text-gray-700',
    label: 'คืนแล้ว',
  },
  lost: {
    badge: '✕ สูญหาย',
    color: 'bg-red-100 text-red-700',
    label: 'สูญหาย',
  },
  overdue: {
    badge: '⚠️ ค้างส่ง',
    color: 'bg-orange-100 text-orange-700',
    label: 'ค้างส่ง',
  },
};

// Rental Statuses
export const RENTAL_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  RETURNED: 'returned',
  LOST: 'lost',
  OVERDUE: 'overdue',
};

// Book Statuses
export const BOOK_STATUS = {
  AVAILABLE: 'available',
  PENDING: 'pending',
  RENTED: 'rented',
  LOST: 'lost',
};

// Roles
export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
};

// Pagination
export const ITEMS_PER_PAGE = 8;
export const ADMIN_ITEMS_PER_PAGE = 10;

// Routes
export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
  },
  MEMBER: {
    DASHBOARD: '/member/dashboard',
    BOOKS: '/member/books',
    RENTALS: '/member/rentals',
    PROFILE: '/member/profile',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    BOOKS: '/admin/books',
    RENTALS: '/admin/rentals',
  },
};
