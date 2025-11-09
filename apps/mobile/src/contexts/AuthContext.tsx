import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { AuthService, LoginResponse } from '../services/authService';

interface AuthContextType {
  user: LoginResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Crear un valor por defecto para el contexto
const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {
    throw new Error('AuthProvider no está inicializado');
  },
  logout: async () => {
    throw new Error('AuthProvider no está inicializado');
  },
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse['user'] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al iniciar
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      if (isAuth) {
        const userData = await AuthService.getUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await AuthService.login({ email, password });
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Redirigir al login después de cerrar sesión
    router.replace('/login');
  };

  // El contexto siempre debe estar disponible, incluso durante la carga
  // Usar useMemo para evitar recrear el objeto en cada render
  const contextValue = React.useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [user, isAuthenticated, isLoading],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  // El contexto siempre tiene un valor (por defecto o del provider)
  return context;
}
