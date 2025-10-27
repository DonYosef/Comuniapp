import axios from 'axios';
import { config } from '@/config/env';

// Configuración base de la API - evitar inicialización en SSR
let API_BASE_URL = 'http://localhost:3001';

// Solo inicializar si estamos en el cliente
if (typeof window !== 'undefined') {
  API_BASE_URL = config.apiUrl || 'http://localhost:3001';

  // Validar que la URL sea válida
  if (!API_BASE_URL || API_BASE_URL === 'null' || API_BASE_URL === 'undefined') {
    console.error('❌ Invalid API_BASE_URL:', API_BASE_URL);
    throw new Error(`Invalid API configuration: ${API_BASE_URL}`);
  }

  console.log('🔧 [api] Initializing with base URL:', API_BASE_URL);
}

// Crear instancia de axios con configuración base
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentar timeout a 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
      // Solo cerrar sesión si es un error de autenticación real (no permisos)
      const isAuthError =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/logout') ||
        error.response?.data?.message?.includes('token') ||
        error.response?.data?.message?.includes('authentication');

      if (isAuthError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        console.error('No autorizado - Token expirado o inválido');

        // Solo redirigir si no estamos ya en la página de login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        // Para otros errores 401 (como permisos), solo logear
        console.warn('Error 401 - Posible problema de permisos:', error.response?.data?.message);
      }
    } else if (error.response?.status >= 500) {
      console.error('Error del servidor:', error.response?.data?.message);
    } else if (error.response?.status === 404) {
      console.warn('Recurso no encontrado:', error.config?.url);
    }
    return Promise.reject(error);
  },
);

export default api;
