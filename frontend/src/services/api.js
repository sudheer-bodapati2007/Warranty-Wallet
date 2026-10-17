import axios from 'axios';

// Get API base URL from Vite env variables or fallback to local backend default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json'
  }
});

// Interceptor: automatically attach JWT Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('warranty_wallet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: catch 401 unauthorized to handle expired sessions gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear invalid token
      if (localStorage.getItem('warranty_wallet_token')) {
        localStorage.removeItem('warranty_wallet_token');
        localStorage.removeItem('warranty_wallet_user');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Get full accessible URL for uploaded images or documents
 * @param {string} filePath - relative upload path, e.g. '/uploads/image.png'
 * @returns {string} full static file URL
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // Server root URL without /api suffix
  const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${serverBase}${cleanPath}`;
};

/* =========================================================================
   AUTHENTICATION API CALLS
   ========================================================================= */

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const forgotPasswordUser = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordUser = async (token, password) => {
  const response = await api.put(`/auth/reset-password/${token}`, { password });
  return response.data;
};

export const googleAuthUser = async (credential) => {
  const response = await api.post('/auth/google', { credential });
  return response.data;
};

export const uploadUserAvatar = async (formData) => {
  const response = await api.put('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const removeUserAvatar = async () => {
  const response = await api.delete('/auth/avatar');
  return response.data;
};

export const searchProductImagesApi = async (query) => {
  const response = await api.get('/products/image-search', {
    params: { q: query }
  });
  return response.data;
};

export const updateUserPreferences = async (preferences) => {
  const response = await api.put('/auth/preferences', preferences);
  return response.data;
};

/* =========================================================================
   WARRANTIES API CALLS
   ========================================================================= */

export const fetchWarranties = async (params = {}) => {
  const response = await api.get('/warranties', { params });
  return response.data;
};

export const fetchWarrantyStats = async () => {
  const response = await api.get('/warranties/stats');
  return response.data;
};

export const fetchWarrantyById = async (id) => {
  const response = await api.get(`/warranties/${id}`);
  return response.data;
};

export const createWarranty = async (formData) => {
  const response = await api.post('/warranties', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const updateWarranty = async (id, formData) => {
  const response = await api.put(`/warranties/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const deleteWarranty = async (id) => {
  const response = await api.delete(`/warranties/${id}`);
  return response.data;
};

export const fetchInvoiceUrl = async (id) => {
  const response = await api.get(`/warranties/${id}/invoice-url`);
  return response.data;
};

/* =========================================================================
   NOTIFICATIONS API CALLS
   ========================================================================= */

export const fetchNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await api.delete('/notifications');
  return response.data;
};

export const triggerReminderScan = async () => {
  const response = await api.post('/notifications/process-reminders');
  return response.data;
};

export default api;
