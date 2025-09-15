'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AuthService from '@/services/authService';

interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token válido al cargar la app
    const storedToken = AuthService.getToken();
    if (storedToken && !AuthService.isTokenExpired()) {
      setToken(storedToken);
      // Aquí podrías hacer una llamada para obtener los datos del usuario
      // Por ahora, asumimos que el token es válido
      setUser({
        id: 'temp-id',
        email: 'admin@comuniapp.com',
        name: 'Super Administrador',
        organizationId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthService.login({ email, password });
      setUser(response.user);
      setToken(response.accessToken);

      // Forzar actualización del estado
      setIsLoading(false);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
