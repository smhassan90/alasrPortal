import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API Base URL - Replace with actual API URL when available
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Validate API URL is set
if (!API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL is not set! Please set it in .env.local or environment variables.');
  console.error('Example: VITE_API_BASE_URL=https://alasrbackend.vercel.app/api/v1');
}

// Log API URL in development (don't log in production for security)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL || 'NOT SET');
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Log requests and add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
      if (!API_BASE_URL) {
        console.error('⚠️ Warning: API_BASE_URL is undefined! Full URL will be:', config.url);
      }
    }
    
    // Add auth token to requests
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Better error logging
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
        fullError: error.response?.data,
      });
    }

    // Handle case where API_BASE_URL is not set
    if (!API_BASE_URL || error.code === 'ERR_INVALID_URL') {
      const errorMessage = 'API Base URL is not configured. Please set VITE_API_BASE_URL in your environment variables.';
      console.error('❌', errorMessage);
      return Promise.reject(new Error(errorMessage));
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      const errorData = error.response?.data;
      const message = errorData?.message || `The requested endpoint was not found: ${error.config?.url}`;
      console.error('❌ 404 Not Found:', message);
      // Don't reject here, let the calling code handle it
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && API_BASE_URL) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // User doesn't have permission
      console.error('Access forbidden');
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };

