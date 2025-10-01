'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  fallback?: ReactNode;
  requireAdmin?: boolean;
}

export default function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  requireAdmin = false,
}: RoleGuardProps) {
  const { user, hasRole, hasPermission, isAdmin } = useAuth();

  // Si no hay usuario autenticado, no mostrar nada
  if (!user) {
    return null;
  }

  // Verificar si es administrador si se requiere
  if (requireAdmin && !isAdmin()) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
            <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      )
    );
  }

  // Verificar rol específico
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
            <p className="text-gray-600">No tienes el rol requerido para acceder a esta sección.</p>
          </div>
        </div>
      )
    );
  }

  // Verificar permiso específico
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
            <p className="text-gray-600">
              No tienes el permiso requerido para acceder a esta sección.
            </p>
          </div>
        </div>
      )
    );
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return <>{children}</>;
}
