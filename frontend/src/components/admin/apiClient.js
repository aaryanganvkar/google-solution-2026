// Create a new file: apiClient.js
import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // IMPORTANT: Send cookies with requests
  timeout: 60000, // 60 second timeout
});

// Request interceptor to add auth headers if needed
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if using JWT
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired, redirect to login
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;