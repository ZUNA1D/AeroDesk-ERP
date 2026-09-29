import axios from 'axios';
import { toast } from 'sonner';

// Resolve API base URL with safe production and development fallbacks
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export function getApiUrl(path = '') {
  const base = (API_BASE_URL || '/api').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function getAssetUrl(url = '') {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = (API_BASE_URL || '').replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${base}${cleanPath}`;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for automatic error messaging and toasts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unknown network error occurred';

    // Global handling for 500 server errors
    if (status >= 500) {
      toast.error('Server error: ' + message);
    } else if (!error.response && error.code === 'ERR_NETWORK') {
      toast.error('Network error: Unable to connect to ERP server');
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
