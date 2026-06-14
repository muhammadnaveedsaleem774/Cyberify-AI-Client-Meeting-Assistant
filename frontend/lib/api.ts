import axios from 'axios';
import { clearTokens, getAccessToken, refreshAccessToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

const api = axios.create({ baseURL: API_BASE });

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((cfg: any) => {
  try {
    const token = getAccessToken();
    if (token) {
      cfg.headers = { ...((cfg.headers as Record<string, any>) || {}), Authorization: `Bearer ${token}` };
    }
  } catch {}
  return cfg;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const url = String(originalRequest?.url || '');

    if (status !== 401 || !originalRequest || originalRequest._retry || url.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise = refreshPromise || refreshAccessToken();
      const newAccessToken = await refreshPromise;
      refreshPromise = null;
      originalRequest.headers = {
        ...((originalRequest.headers as Record<string, any>) || {}),
        Authorization: `Bearer ${newAccessToken}`
      };
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      clearTokens();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
