import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const currentPath = window.location.pathname;

    if (
      err.response?.status === 401 &&
      currentPath !== '/login' &&
      currentPath !== '/register'
    ) {
      localStorage.removeItem('mm_token');
      localStorage.removeItem('account_id');

      // ✅ prevent infinite reload loop
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
