'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/hooks/useCommunity';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  isSidebarCollapsed?: boolean;
}

export default function Topbar({ isSidebarCollapsed = false }: TopbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCommunityMenuOpen, setIsCommunityMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { currentCommunity, communities, setCurrentCommunity, loadCommunities, units } =
    useCommunity();
  // Manejo seguro del tema con fallback
  let resolvedTheme: 'light' | 'dark' = 'dark'; // Tema oscuro por defecto
  let toggleTheme: () => void = () => {};

  try {
    const themeContext = useTheme();
    resolvedTheme = themeContext.resolvedTheme;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    // Si useTheme falla, usar tema del DOM como fallback
    console.warn('useTheme no disponible, usando fallback:', error);

    // Verificar que estamos en el cliente antes de acceder a document
    if (typeof window !== 'undefined' && document) {
      resolvedTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
      toggleTheme = () => {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        // Actualizar variables CSS
        const bgColor = newTheme === 'dark' ? '#0a0a0a' : '#ffffff';
        const textColor = newTheme === 'dark' ? '#ededed' : '#171717';

        document.documentElement.style.setProperty('--background', bgColor);
        document.documentElement.style.setProperty('--foreground', textColor);

        // Guardar en localStorage
        try {
          localStorage.setItem('comuniapp-theme', newTheme);
        } catch (e) {
          console.warn('No se pudo guardar el tema en localStorage:', e);
        }
      };
    } else {
      // En el servidor, mantener tema oscuro por defecto
      console.warn('Ejecutándose en servidor, usando tema oscuro por defecto');
    }
  }
  const router = useRouter();

  // Debug: Mostrar información del usuario
  console.log('🔍 [Topbar] Información del usuario:');
  console.log('- user:', user);
  console.log('- user.roles:', user?.roles);
  console.log('- user.name:', user?.name);

  // El tema ahora se maneja a través del useTheme hook

  // Función para manejar logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      // No hacer router.push aquí, el AuthService ya maneja la redirección
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsUserMenuOpen(false);
    }
  };

  // Función para cambiar comunidad
  const handleCommunityChange = (communityId: string) => {
    const community = communities.find((c) => c.id === communityId);
    if (community) {
      setCurrentCommunity(community);
      setIsCommunityMenuOpen(false);
    }
  };

  // Función para cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container') && !target.closest('.community-menu-container')) {
        setIsUserMenuOpen(false);
        setIsCommunityMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determinar si el usuario es administrador (puede cambiar de comunidad)
  const { hasRole } = useAuth();
  const isAdmin = hasRole('SUPER_ADMIN') || hasRole('COMMUNITY_ADMIN');

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Título móvil cuando sidebar está colapsado */}
        {isSidebarCollapsed && (
          <div className="flex items-center ml-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Comuniapp
            </h1>
          </div>
        )}

        {/* Espaciador cuando sidebar no está colapsado */}
        {!isSidebarCollapsed && <div className="flex-1"></div>}

        {/* Controles del usuario */}
        <div className="flex items-center space-x-4">
          {/* Selector de comunidad (solo para administradores) */}
          {isAdmin && (
            <div className="relative community-menu-container">
              <button
                onClick={() => setIsCommunityMenuOpen(!isCommunityMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
              >
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {currentCommunity
                    ? `${currentCommunity.name} - ${currentCommunity.address}`
                    : 'Comunidades'}
                </span>
                {communities.length > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </button>

              {/* Menú desplegable de comunidades */}
              {isCommunityMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {communities.length > 0 ? 'Comunidades' : 'Gestión de Comunidades'}
                    </p>
                  </div>

                  {/* Lista de comunidades existentes */}
                  {communities.length > 0 ? (
                    <>
                      {communities.map((community) => (
                        <button
                          key={community.id}
                          onClick={() => handleCommunityChange(community.id)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                            currentCommunity?.id === community.id
                              ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="font-medium">{community.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {community.address}
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      No tienes comunidades asignadas
                    </div>
                  )}

                  {/* Opción Nueva Comunidad */}
                  <button
                    onClick={() => {
                      router.push('/dashboard/comunidad/nueva');
                      setIsCommunityMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-2 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Nueva Comunidad
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selector de tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-label={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {resolvedTheme === 'dark' ? (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Notificaciones */}
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5-5V9a6 6 0 10-12 0v3l-5 5h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Indicador de notificación */}
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Avatar de usuario con menú desplegable */}
          <div className="relative user-menu-container">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name
                    ? user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roles?.[0]?.name || 'Usuario'}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Menú desplegable */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <a
                  href="#"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Mi perfil
                </a>
                <a
                  href="#"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                  </svg>
                  Configuración
                </a>
                {isAdmin && currentCommunity && (
                  <button
                    onClick={() => {
                      router.push(`/dashboard/comunidad/${currentCommunity.id}`);
                      setIsUserMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Ajuste de comunidad
                  </button>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
