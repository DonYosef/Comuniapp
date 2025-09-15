import axios from 'axios';
import { config } from '@/config/env';

// Configuración base de la API
const API_BASE_URL = config.apiUrl;

// Crear instancia de axios con configuración base
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo global de errores
    if (error.response?.status === 401) {
      // Limpiar token y redirigir al login si no está autenticado
      localStorage.removeItem('token');
      console.error('No autorizado - Token expirado o inválido');

      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status >= 500) {
      console.error('Error del servidor');
    }
    return Promise.reject(error);
  },
);

export default api;
