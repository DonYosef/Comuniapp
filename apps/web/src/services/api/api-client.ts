import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuración base del cliente API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Aumentar timeout a 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para agregar token de autenticación
    this.client.interceptors.request.use(
      (config) => {
        // Obtener token del localStorage o cookies
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor para manejar errores globales
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Manejar errores de autenticación
        if (error.response?.status === 401) {
          // Solo cerrar sesión si es un error de token inválido/expirado
          const errorMessage = error.response?.data?.message || '';
          if (errorMessage.includes('Token JWT inválido') || errorMessage.includes('expirado')) {
            console.warn('🔒 Token JWT inválido o expirado, cerrando sesión');
            this.handleUnauthorized();
          } else {
            console.warn('🔒 Error 401 no relacionado con token:', errorMessage);
          }
        }

        // Manejar errores de red
        if (!error.response) {
          console.error('Error de red:', error.message);
        }

        return Promise.reject(error);
      },
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  }

  private handleUnauthorized() {
    // Limpiar tokens y redirigir al login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
  }

  // Métodos HTTP
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  // Método para establecer token de autenticación
  setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  // Método para limpiar token de autenticación
  clearAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();
