import axios from 'axios';

// Konfigurasi endpoint dasar (backend)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Agar bisa mengirim/menerima refresh cookie
});

// Interceptor request: sisipkan JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
        // Coba tembak endpoint refresh-token
        const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        // Simpan token baru
        const newToken = res.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        
        // Sisipkan dan ulangi request yang gagal
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh token gagal / daluarsa total -> Paksa Log out
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
