import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Usar URL inyectada en runtime o fallback a variable de build o localhost
const API_URL = (window as any).__API_URL__ || import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  console.log('🔑 Request interceptor - Token:', accessToken ? `${accessToken.substring(0, 30)}...` : 'NO TOKEN');
  console.log('📍 Request URL:', config.url);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    console.log('✅ Authorization header set');
  } else {
    console.log('❌ NO accessToken available');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken
          });

          useAuthStore.setState({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          });

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
