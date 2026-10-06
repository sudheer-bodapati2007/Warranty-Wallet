import axios from 'axios';

// Get API base URL from Vite env variables or fallback to local backend default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json'
  }
});

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

/**
 * Fetch list of warranties with optional filters and search
 */
export const fetchWarranties = async (params = {}) => {
  const response = await api.get('/warranties', { params });
  return response.data;
};

/**
 * Fetch dashboard stats and priority items
 */
export const fetchWarrantyStats = async () => {
  const response = await api.get('/warranties/stats');
  return response.data;
};

/**
 * Fetch single warranty by ID
 */
export const fetchWarrantyById = async (id) => {
  const response = await api.get(`/warranties/${id}`);
  return response.data;
};

/**
 * Create a new warranty item (supports file uploads via FormData)
 */
export const createWarranty = async (formData) => {
  const response = await api.post('/warranties', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Update an existing warranty item (supports file uploads via FormData)
 */
export const updateWarranty = async (id, formData) => {
  const response = await api.put(`/warranties/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Delete a warranty item by ID
 */
export const deleteWarranty = async (id) => {
  const response = await api.delete(`/warranties/${id}`);
  return response.data;
};

export default api;
