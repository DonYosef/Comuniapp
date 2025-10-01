'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCommunities } from '@/hooks/useCommunities';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
  submenuItems?: SubmenuItem[];
}

interface SubmenuItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

export default function Sidebar({ isCollapsed = true, onToggle, onHoverChange }: SidebarProps) {
  const pathname = usePathname();
  const { communities, hasCommunities } = useCommunities();
  const { isAdmin, hasPermission, hasRole } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // Función para alternar el estado de expansión de un elemento
  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    );
  };

  // Función para manejar el hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  // Generar elementos de navegación dinámicamente
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
            />
          </svg>
        ),
      },
    ];

    // Solo mostrar Residentes si el usuario tiene permisos de administración
    if (isAdmin() || hasPermission('manage_community_users')) {
      baseItems.push({
        name: 'Residentes',
        href: '/dashboard/residentes',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        ),
      });
    }

    // Solo mostrar Gastos Comunes si el usuario tiene permisos de administración
    if (isAdmin() || hasPermission('manage_community_expenses')) {
      baseItems.push({
        name: 'Gastos Comunes',
        href: '/dashboard/gastos-comunes',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
      });
    }

    // Solo mostrar Finanzas si el usuario tiene permisos de administración
    if (isAdmin()) {
      baseItems.push({
        name: 'Finanzas',
        href: '/dashboard/finanzas',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        ),
      });
    }

    // Solo mostrar Eventos si el usuario tiene permisos de administración
    if (isAdmin()) {
      baseItems.push({
        name: 'Eventos',
        href: '/dashboard/eventos',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ),
      });
    }

    // Solo mostrar Mis Gastos si el usuario tiene permisos para ver sus propios gastos
    if (hasPermission('view_own_expenses')) {
      baseItems.push({
        name: 'Mis Gastos',
        href: '/dashboard/mis-gastos',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
      });
    }

    // Crear submenú de comunidades según el tipo de usuario
    const communitySubmenuItems: SubmenuItem[] = [];

    // Tanto SUPER_ADMIN como COMMUNITY_ADMIN usan el hook useCommunities
    if (hasRole('SUPER_ADMIN') || hasRole('COMMUNITY_ADMIN')) {
      // Usar el hook useCommunities que ya tiene la lógica correcta del backend
      communitySubmenuItems.push(
        ...(hasCommunities
          ? communities.map((community) => ({
              name: community.name,
              href: `/dashboard/comunidad/${community.id}`,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              ),
            }))
          : []),
        // Siempre incluir la opción de crear nueva comunidad al final
        {
          name: 'Crear Comunidad',
          href: '/dashboard/comunidad/nueva',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          ),
        },
      );
    }

    // Solo mostrar Comunidades si el usuario es administrador y tiene comunidades
    if (isAdmin() && communitySubmenuItems.length > 0) {
      const ajustesItem: NavItem = {
        name: 'Comunidades',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        ),
        hasSubmenu: true,
        submenuItems: communitySubmenuItems,
      };

      return [...baseItems, ajustesItem];
    }

    return baseItems;
  };

  return (
    <div
      className={`
        fixed left-0 top-0 z-40 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out shadow-xl
        ${isCollapsed && !isHovered ? 'w-16' : 'w-64 sm:w-72'}
        lg:translate-x-0
        ${isCollapsed && !isHovered ? 'translate-x-0' : 'translate-x-0'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div
        className={`flex items-center ${isCollapsed && !isHovered ? 'justify-center' : 'justify-start'} h-16 sm:h-18 ${isCollapsed && !isHovered ? 'px-2' : 'px-4 sm:px-6'} border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
          </div>
          {!(isCollapsed && !isHovered) && (
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Comuniapp
            </h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 ${isCollapsed && !isHovered ? 'px-2' : 'px-4 sm:px-6'} py-4 sm:py-6 space-y-1 sm:space-y-2`}
      >
        {getNavItems().map((item) => {
          const isActive = pathname === item.href;
          const isExpanded = expandedItems.includes(item.name);

          if (item.hasSubmenu) {
            return (
              <div key={item.name}>
                {/* Botón principal del submenú */}
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={`
                    w-full flex items-center ${isCollapsed && !isHovered ? 'justify-center' : 'justify-between'} ${isCollapsed && !isHovered ? 'px-2 py-3' : 'px-3 sm:px-4 py-3 sm:py-2'} rounded-xl text-sm font-medium transition-all duration-200
                    group relative
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-blue-900/20 hover:text-gray-900 dark:hover:text-white hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <span
                      className={`
                        flex-shrink-0 transition-all duration-200 p-1 rounded-lg
                        ${isActive ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'}
                      `}
                    >
                      {item.icon}
                    </span>
                    {!(isCollapsed && !isHovered) && (
                      <span className="ml-3 transition-opacity duration-200">{item.name}</span>
                    )}
                  </div>

                  {!(isCollapsed && !isHovered) && (
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
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

                  {/* Tooltip para modo colapsado */}
                  {isCollapsed && !isHovered && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 border border-gray-700 dark:border-gray-600 transform translate-y-1">
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-b border-gray-700 dark:border-gray-600 rotate-45"></div>
                      {item.name}
                    </div>
                  )}
                </button>

                {/* Submenú */}
                {!(isCollapsed && !isHovered) && isExpanded && item.submenuItems && (
                  <div className="ml-4 sm:ml-6 mt-2 space-y-1">
                    {item.submenuItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href as any}
                        className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-blue-900/20 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
                      >
                        {subItem.icon && (
                          <span className="flex-shrink-0 mr-3 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">
                            {subItem.icon}
                          </span>
                        )}
                        <span>{subItem.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Elemento normal sin submenú
          return (
            <Link
              key={item.name}
              href={item.href as any}
              className={`
                flex items-center ${isCollapsed && !isHovered ? 'justify-center' : ''} ${isCollapsed && !isHovered ? 'px-2 py-3' : 'px-3 sm:px-4 py-3 sm:py-2'} rounded-xl text-sm font-medium transition-all duration-200
                group relative
                ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-blue-900/20 hover:text-gray-900 dark:hover:text-white hover:shadow-sm'
                }
              `}
            >
              <span
                className={`
                  flex-shrink-0 transition-all duration-200 p-1 rounded-lg
                  ${isActive ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'}
                `}
              >
                {item.icon}
              </span>
              {!(isCollapsed && !isHovered) && (
                <span className="ml-3 transition-opacity duration-200">{item.name}</span>
              )}

              {/* Tooltip para modo colapsado */}
              {isCollapsed && !isHovered && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 border border-gray-700 dark:border-gray-600 transform translate-y-1">
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-b border-gray-700 dark:border-gray-600 rotate-45"></div>
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={`${isCollapsed && !isHovered ? 'p-2' : 'p-4 sm:p-6'} border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900`}
      >
        {!(isCollapsed && !isHovered) && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="text-xs text-gray-500 dark:text-gray-400">© 2024 Comuniapp</div>
          </div>
        )}
        {isCollapsed && !isHovered && (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
