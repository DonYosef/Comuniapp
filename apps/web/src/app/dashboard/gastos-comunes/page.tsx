'use client';

import { useState } from 'react';
import { useCommunity } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import CommonExpensesDashboard from '@/components/common-expenses/CommonExpensesDashboard';
import ExpenseConfigModal from '@/components/common-expenses/ExpenseConfigModal';
import { LoadingSpinner } from '@/components/common-expenses/CommonExpenseComponents';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function GastosComunesPage() {
  const { currentCommunity, communities, isLoading: communitiesLoading } = useCommunity();
  const { user } = useAuth();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (communitiesLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (communities.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gastos Comunes</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gestiona los gastos comunes de tus comunidades
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tienes comunidades asignadas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Para gestionar gastos comunes, necesitas tener al menos una comunidad asignada.
              </p>
              <a
                href="/dashboard/comunidad/nueva"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Crear Comunidad
              </a>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Si no hay comunidad seleccionada, mostrar mensaje
  if (!currentCommunity) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gastos Comunes</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gestiona los gastos comunes de tus comunidades
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Selecciona una comunidad
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      Por favor, selecciona una comunidad desde el menú superior para ver sus gastos
                      comunes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['SUPER_ADMIN', 'COMMUNITY_ADMIN', 'RESIDENT']}>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Gastos Comunes
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Gestiona los gastos comunes de{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {currentCommunity.name}
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                    Configuración
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard de gastos comunes usando la comunidad seleccionada */}
            <CommonExpensesDashboard
              communityId={currentCommunity.id}
              key={refreshKey} // Forzar re-render cuando cambie el refreshKey
            />
          </div>

          {/* Modales */}
          <ExpenseConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => {
              setIsConfigModalOpen(false);
              // Actualizar la grilla después de cerrar el modal
              setRefreshKey((prev) => prev + 1);
            }}
            communityId={currentCommunity.id}
          />
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
