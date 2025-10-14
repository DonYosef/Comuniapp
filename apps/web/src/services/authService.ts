import { api } from '@/lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string | null;
    roles?: Array<{
      id: string;
      name: string;
      permissions: string[];
    }>;
    communities?: Array<{
      id: string;
      name: string;
      address: string;
      status: string;
    }>;
    userUnits?: Array<{
      id: string;
      unit: {
        id: string;
        number: string;
        floor?: string;
        community: {
          id: string;
          name: string;
          address: string;
        };
      };
    }>;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  organizationId?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  organizationId?: string;
  communityId?: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  email: string;
  name: string;
}

export interface CommunityForRegistration {
  id: string;
  name: string;
  address: string;
  type: 'CONDOMINIO' | 'EDIFICIO' | 'RESIDENCIAL';
  organization: {
    id: string;
    name: string;
  };
}

export class AuthService {
  // Login
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    console.log('🔍 [AuthService] login - response data:', response.data);
    console.log('🔍 [AuthService] login - user units:', response.data.user.userUnits);

    // Guardar token en localStorage y cookies
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);

      // También guardar en cookies para el middleware
      document.cookie = `token=${response.data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

      // Disparar evento personalizado para notificar cambios de autenticación
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { type: 'login' } }));
    }

    return response.data;
  }

  // Register
  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', userData);
    return response.data;
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      // Llamar al endpoint de logout del backend si hay token
      const token = this.getToken();
      if (token) {
        await api.post(
          '/auth/logout',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
    } catch (error) {
      // No importa si falla el logout del backend, continuamos con la limpieza local
      console.warn('Error al cerrar sesión en el servidor:', error);
    } finally {
      // Limpiar datos locales independientemente del resultado del backend
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Limpiar cookies también
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';

      // Limpiar sessionStorage
      sessionStorage.clear();

      // Disparar evento personalizado para notificar cambios de autenticación
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { type: 'logout' } }));

      // Redirigir al login si es necesario
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  // Verificar si está autenticado
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Obtener token
  static getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('🔐 [AuthService] getToken():', token ? 'Token encontrado' : 'No hay token');
    return token;
  }

  // Verificar si el token está expirado (básico)
  static isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log('🔐 [AuthService] isTokenExpired(): No hay token');
      return true;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp < currentTime;
      console.log(
        '🔐 [AuthService] isTokenExpired():',
        isExpired ? 'Token expirado' : 'Token válido',
      );
      return isExpired;
    } catch (error) {
      console.log('🔐 [AuthService] isTokenExpired(): Error decodificando token');
      return true;
    }
  }

  // Obtener comunidades disponibles para registro
  static async getCommunitiesForRegistration(): Promise<CommunityForRegistration[]> {
    const response = await api.get<CommunityForRegistration[]>('/auth/communities');
    return response.data;
  }
}

export default AuthService;
