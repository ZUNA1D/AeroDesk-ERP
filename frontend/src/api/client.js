import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for automatic error messaging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unknown network error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
