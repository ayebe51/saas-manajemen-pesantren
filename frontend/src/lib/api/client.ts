import axios from 'axios';

// Konfigurasi endpoint dasar (backend)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Agar bisa mengirim/menerima refresh cookie
});

// Interceptor request: sisipkan JWT
// eslint-disable-next-line @typescript-eslint/no-unused-vars
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Interceptor response: tangani token kedaluwarsa (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Jika Unauthorized (Token daluarsa) dan belum re-retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');

        // Coba refresh — kirim via cookie (production) atau body (development)
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          refreshToken ? { refreshToken } : {},
          { withCredentials: true }
        );
        
        // Simpan token baru
        const newToken = res.data.accessToken || res.data.data?.accessToken;
        const newRefresh = res.data.refreshToken || res.data.data?.refreshToken;
        localStorage.setItem('accessToken', newToken);
        if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
        
        // Sisipkan dan ulangi request yang gagal
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh token gagal / daluarsa total -> Paksa Log out
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
