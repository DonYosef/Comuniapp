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
  const { user, isAdmin, hasPermission, hasRole } = useAuth();
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
    // Debug: Verificar roles y permisos del usuario
    console.log('🔍 [Sidebar] Debug de permisos:');
    console.log('- isAdmin():', isAdmin());
    console.log('- hasRole("SUPER_ADMIN"):', hasRole('SUPER_ADMIN'));
    console.log('- hasRole("COMMUNITY_ADMIN"):', hasRole('COMMUNITY_ADMIN'));
    console.log('- hasRole("RESIDENT"):', hasRole('RESIDENT'));
    console.log(
      '- hasPermission("manage_community_users"):',
      hasPermission('manage_community_users'),
    );
    console.log('- user.roles:', user?.roles);
    console.log('- user.name:', user?.name);

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

    // Solo mostrar Residentes si el usuario NO es residente y tiene permisos de administración
    const isResident = hasRole('RESIDENT');
    const canManageUsers = isAdmin() || hasPermission('manage_community_users');

    console.log('🔍 [Sidebar] Verificando módulo Residentes:');
    console.log('- isResident:', isResident);
    console.log('- isAdmin():', isAdmin());
    console.log(
      '- hasPermission("manage_community_users"):',
      hasPermission('manage_community_users'),
    );
    console.log('- canManageUsers:', canManageUsers);
    console.log('- Condición final:', !isResident && canManageUsers);

    if (!isResident && canManageUsers) {
      console.log('✅ [Sidebar] Agregando módulo Residentes');
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
    } else {
      console.log('❌ [Sidebar] NO agregando módulo Residentes - Es residente o sin permisos');
    }

    // Mostrar Gastos Comunes solo para administradores (no residentes)
    const canAccessExpenses = isAdmin() || hasPermission('manage_community_expenses');

    console.log('🔍 [Sidebar] Verificando módulo Gastos Comunes:');
    console.log('- isAdmin():', isAdmin());
    console.log(
      '- hasPermission("manage_community_expenses"):',
      hasPermission('manage_community_expenses'),
    );
    console.log('- isResident:', isResident);
    console.log('- canAccessExpenses:', canAccessExpenses);

    if (canAccessExpenses) {
      console.log('✅ [Sidebar] Agregando módulo Gastos Comunes');
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

    // Mostrar Encomiendas - vista unificada que se adapta al rol
    const canAccessParcels = isAdmin() || hasPermission('manage_parcels') || isResident;

    console.log('🔍 [Sidebar] Verificando módulo Encomiendas:');
    console.log('- isAdmin():', isAdmin());
    console.log('- hasPermission("manage_parcels"):', hasPermission('manage_parcels'));
    console.log('- isResident:', isResident);
    console.log('- canAccessParcels:', canAccessParcels);

    if (canAccessParcels) {
      console.log('✅ [Sidebar] Agregando módulo Encomiendas (vista dinámica)');
      baseItems.push({
        name: isResident ? 'Tus Encomiendas' : 'Encomiendas',
        href: '/dashboard/encomiendas',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        ),
      });
    }

    // Mostrar Visitas - vista unificada que se adapta al rol
    const isJanitor = hasRole('CONCIERGE');
    const canAccessVisits = isAdmin() || isResident || isJanitor;

    console.log('🔍 [Sidebar] Verificando módulo Visitas:');
    console.log('- isAdmin():', isAdmin());
    console.log('- isResident:', isResident);
    console.log('- isJanitor:', isJanitor);
    console.log('- canAccessVisits:', canAccessVisits);

    if (canAccessVisits) {
      console.log('✅ [Sidebar] Agregando módulo Visitas (vista dinámica)');
      baseItems.push({
        name: isResident ? 'Tus Visitas' : 'Visitas',
        href: '/dashboard/visitas',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
      });
    }

    // Solo mostrar Mis Gastos para residentes exclusivamente
    console.log('🔍 [Sidebar] Verificando módulo Mis Gastos:');
    console.log('- isResident:', isResident);

    if (isResident) {
      console.log('✅ [Sidebar] Agregando módulo Mis Gastos (solo residentes)');
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

      // Agregar Mis Reservas para residentes
      console.log('✅ [Sidebar] Agregando módulo Mis Reservas (solo residentes)');
      baseItems.push({
        name: 'Mis Reservas',
        href: '/dashboard/mis-reservas',
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
    } else {
      console.log('❌ [Sidebar] NO agregando módulo Mis Gastos - No es residente');
    }

    // Mostrar Avisos para administradores y residentes
    const canManageAnnouncements = isAdmin() || hasRole('COMMUNITY_ADMIN');
    const canViewAnnouncements = isResident;

    console.log('🔍 [Sidebar] Verificando módulo Avisos:');
    console.log('- isAdmin():', isAdmin());
    console.log('- hasRole("COMMUNITY_ADMIN"):', hasRole('COMMUNITY_ADMIN'));
    console.log('- isResident:', isResident);
    console.log('- canManageAnnouncements:', canManageAnnouncements);
    console.log('- canViewAnnouncements:', canViewAnnouncements);

    if (canManageAnnouncements) {
      console.log('✅ [Sidebar] Agregando módulo Avisos (Admin)');
      baseItems.push({
        name: 'Avisos',
        href: '/dashboard/avisos',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
        ),
      });
    } else if (canViewAnnouncements) {
      console.log('✅ [Sidebar] Agregando módulo Avisos (Residente)');
      baseItems.push({
        name: 'Avisos',
        href: '/dashboard/avisos-residente',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
        ),
      });
    } else {
      console.log('❌ [Sidebar] NO agregando módulo Avisos - Sin permisos');
    }

    // Mostrar Reservas solo para conserje con submenú
    const isConcierge = hasRole('CONCIERGE');
    if (isConcierge) {
      console.log('✅ [Sidebar] Agregando módulo Reservas (Conserje)');
      baseItems.push({
        name: 'Reservas',
        href: '/dashboard/conserje/reservas',
        hasSubmenu: true,
        submenuItems: [
          {
            name: 'Ver Reservas',
            href: '/dashboard/conserje/reservas',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            ),
          },
          {
            name: 'Registrar Reserva',
            href: '/dashboard/conserje/reservar-espacio',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            ),
          },
        ],
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

    // Solo mostrar Comunidades si el usuario NO es residente, es administrador y tiene comunidades
    console.log('🔍 [Sidebar] Verificando módulo Comunidades:');
    console.log('- isResident:', isResident);
    console.log('- isAdmin():', isAdmin());
    console.log('- communitySubmenuItems.length:', communitySubmenuItems.length);
    console.log(
      '- Condición completa:',
      !isResident && isAdmin() && communitySubmenuItems.length > 0,
    );

    if (!isResident && isAdmin() && communitySubmenuItems.length > 0) {
      console.log('✅ [Sidebar] Agregando módulo Comunidades');
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

      baseItems.push(ajustesItem);
    } else {
      console.log(
        '❌ [Sidebar] NO agregando módulo Comunidades - Es residente, sin permisos o sin comunidades',
      );
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
