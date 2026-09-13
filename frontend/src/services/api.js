import axios from 'axios';

/**
 * Centralized Axios client instance
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enables sending/receiving HTTP-only cookies
  timeout: 15000,
});

// Request interceptor for attaching auth token (for future phases)
api.interceptors.request.use(
  (config) => {
    // Interceptor ready for token injection in authentication phase
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for consistent response data & error unwrapping
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'Network error occurred',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || [],
      raw: error,
    };
    return Promise.reject(customError);
  }
);

export default api;
