import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, clear token and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch a custom event to notify components (like AuthProvider) of unauthorized state
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
