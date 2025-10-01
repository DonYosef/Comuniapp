'use client';

import { useState } from 'react';
import { useCommunities } from '@/hooks/useCommunities';
import { useCommonExpenses } from '@/hooks/useCommonExpenses';
import CommonExpensesDashboard from '@/components/common-expenses/CommonExpensesDashboard';
import { LoadingSpinner } from '@/components/common-expenses/CommonExpenseComponents';
import { useAuth } from '@/hooks/useAuth';

export default function GastosComunesPage() {
  const { communities, isLoading: communitiesLoading } = useCommunities();
  const { user } = useAuth();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');

  // Si solo hay una comunidad, seleccionarla automáticamente
  if (communities.length === 1 && !selectedCommunityId) {
    setSelectedCommunityId(communities[0].id);
  }

  if (communitiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gastos Comunes</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona los gastos comunes de tus comunidades
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
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
            No tienes comunidades
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Necesitas crear una comunidad antes de poder gestionar gastos comunes.
          </p>
          <a
            href="/dashboard/comunidad/nueva"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gastos Comunes</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gestiona los gastos comunes de tus comunidades
        </p>
      </div>

      {/* Selector de comunidad */}
      {communities.length > 1 && (
        <div className="mb-6">
          <label
            htmlFor="community-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Seleccionar Comunidad
          </label>
          <select
            id="community-select"
            value={selectedCommunityId}
            onChange={(e) => setSelectedCommunityId(e.target.value)}
            className="block w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona una comunidad</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dashboard de gastos comunes */}
      {selectedCommunityId && <CommonExpensesDashboard communityId={selectedCommunityId} />}

      {/* Mensaje cuando no hay comunidad seleccionada */}
      {!selectedCommunityId && communities.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
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
            Selecciona una comunidad
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Elige una comunidad para ver y gestionar sus gastos comunes.
          </p>
        </div>
      )}
    </div>
  );
}
