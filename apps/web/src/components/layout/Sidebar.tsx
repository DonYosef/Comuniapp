'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCommunities } from '@/hooks/useCommunities';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
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

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { communities, hasCommunities } = useCommunities();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Función para alternar el estado de expansión de un elemento
  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    );
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
      {
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
      },
      {
        name: 'Finanzas',
        href: '/dashboard/finanzas',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        ),
      },
      {
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
      },
    ];

    // Crear submenú de comunidades para Ajustes
    const communitySubmenuItems: SubmenuItem[] = [
      // Agregar las comunidades existentes si las hay primero
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
    ];

    const ajustesItem: NavItem = {
      name: 'Ajustes comunidad',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      hasSubmenu: true,
      submenuItems: communitySubmenuItems,
    };

    return [...baseItems, ajustesItem];
  };

  return (
    <div
      className={`
        fixed left-0 top-0 z-40 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        lg:translate-x-0
        ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && <h1 className="text-xl font-bold gradient-title-primary">Comuniapp</h1>}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isCollapsed ? 'M4 6h16M4 12h16M4 18h16' : 'M6 18L18 6M6 6l12 12'}
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
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
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    group relative
                    ${
                      isActive
                        ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <span
                      className={`
                        flex-shrink-0 transition-colors duration-200
                        ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}
                      `}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="ml-3 transition-opacity duration-200">{item.name}</span>
                    )}
                  </div>

                  {!isCollapsed && (
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
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </button>

                {/* Submenú */}
                {!isCollapsed && isExpanded && item.submenuItems && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.submenuItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href as any}
                        className="flex items-center px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                      >
                        {subItem.icon && (
                          <span className="flex-shrink-0 mr-3 text-gray-500 dark:text-gray-400">
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
                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                group relative
                ${
                  isActive
                    ? 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <span
                className={`
                  flex-shrink-0 transition-colors duration-200
                  ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}
                `}
              >
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="ml-3 transition-opacity duration-200">{item.name}</span>
              )}

              {/* Tooltip para modo colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 dark:text-gray-400">© 2024 Comuniapp</div>
        )}
      </div>
    </div>
  );
}
