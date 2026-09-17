// Centralized API Configuration for Admin App

export const getApiBaseUrl = () => {
  const envUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
                 (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL);

  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  return 'https://api.maytriambhuja.in/api';
};

export const API_BASE_URL = getApiBaseUrl();

export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE_URL.replace(/\/api$/, '')}/api/health`);
    if (!res.ok) return { online: false, status: res.status };
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}
