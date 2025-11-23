'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useCommunities } from '@/hooks/useCommunities';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useCommunity } from '@/hooks/useCommunity';
import CommunitiesSkeleton from '@/components/ui/CommunitiesSkeleton';

export default function DashboardPage() {
  const { communities, isLoading, hasCommunities } = useCommunities();
  const { user } = useAuth();
  const { stats, isLoading: statsLoading, error } = useDashboardStats();
  const { currentCommunity } = useCommunity();
  const isConcierge = user?.roles?.some((r) => r.name === 'CONCIERGE');
  const isCommunityAdmin = user?.roles?.some((r) => r.name === 'COMMUNITY_ADMIN');
  const isResident = user?.roles?.some(
    (r) => r.name === 'RESIDENT' || r.name === 'OWNER' || r.name === 'TENANT',
  );

  if (isLoading || statsLoading) {
    return (
      <ProtectedRoute>
        <CommunitiesSkeleton />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header de la página */}
        <div>
          <h1 className="text-2xl font-bold gradient-title-primary">
            {isConcierge && communities[0] ? communities[0].name : 'Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isConcierge && communities[0]
              ? 'Tu residencia'
              : 'Bienvenido a la administración de Comuniapp'}
          </p>
        </div>

        {/* Comunidades del usuario - No se muestra para residentes ni conserjes */}
        {hasCommunities && !isConcierge && !isResident && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tus Comunidades ({communities.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((community, index) => (
                <div
                  key={`${community?.id ?? community?.name ?? 'community'}-${index}`}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {community.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {community.address}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {community.totalUnits} unidades
                    </span>
                    <a
                      href={`/dashboard/comunidad/${community.id}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Ver detalles →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vista simplificada para conserje: solo su comunidad */}
        {hasCommunities && isConcierge && communities[0] && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tu Comunidad
            </h2>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {communities[0].name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {communities[0].address}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {communities[0].totalUnits} unidades
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">&nbsp;</span>
              </div>
            </div>
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Avisos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
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
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avisos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.recentAnnouncements?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Reservaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reservas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.stats.totalReservations || 0}
                </p>
                {stats?.stats.pendingReservations && stats.stats.pendingReservations > 0 ? (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {stats.stats.pendingReservations} pendientes
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Visitas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visitas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.stats.totalVisitors || 0}
                </p>
                {stats?.stats.pendingVisitors && stats.stats.pendingVisitors > 0 ? (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {stats.stats.pendingVisitors} pendientes
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Encomiendas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Encomiendas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.stats.totalParcels || 0}
                </p>
                {stats?.stats.pendingParcels && stats.stats.pendingParcels > 0 ? (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {stats.stats.pendingParcels} recibidas
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actividad reciente / Resumen financiero / Último pago */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isResident
                ? 'Último pago realizado'
                : stats?.financialSummary
                  ? 'Resumen financiero'
                  : 'Actividad reciente'}
            </h3>
            <div className="space-y-4">
              {isResident && stats?.lastPayment ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {stats.lastPayment.expense.concept}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gasto común</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${stats.lastPayment.amount.toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Estado del pago
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stats.lastPayment.status === 'PAID'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : stats.lastPayment.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : stats.lastPayment.status === 'FAILED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {stats.lastPayment.status === 'PAID'
                          ? 'Pagado'
                          : stats.lastPayment.status === 'PENDING'
                            ? 'Pendiente'
                            : stats.lastPayment.status === 'FAILED'
                              ? 'Fallido'
                              : stats.lastPayment.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {stats.lastPayment.paymentDate
                          ? new Date(stats.lastPayment.paymentDate).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : new Date(stats.lastPayment.createdAt).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Método de pago:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {stats.lastPayment.method === 'FLOW'
                          ? 'Flow'
                          : stats.lastPayment.method === 'BANK_TRANSFER'
                            ? 'Transferencia bancaria'
                            : stats.lastPayment.method === 'CARD'
                              ? 'Tarjeta'
                              : stats.lastPayment.method === 'CASH'
                                ? 'Efectivo'
                                : stats.lastPayment.method === 'CHECK'
                                  ? 'Cheque'
                                  : stats.lastPayment.method}
                      </span>
                    </p>
                  </div>
                </div>
              ) : isResident && !stats?.lastPayment ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay pagos registrados
                  </p>
                </div>
              ) : stats?.financialSummary ? (
                // Resumen financiero para admins
                <div className="space-y-4">
                  {/* Total de Gastos */}
                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                        <svg
                          className="w-6 h-6 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-900 dark:text-red-300">
                          Total Gastos
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400">Pagos realizados</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-red-700 dark:text-red-400">
                      ${stats.financialSummary.totalExpenses.toLocaleString('es-CL')}
                    </p>
                  </div>

                  {/* Total de Ingresos */}
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <svg
                          className="w-6 h-6 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-900 dark:text-green-300">
                          Total Ingresos
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          Ingresos registrados
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">
                      ${stats.financialSummary.totalIncomes.toLocaleString('es-CL')}
                    </p>
                  </div>

                  {/* Balance */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      stats.financialSummary.balance >= 0
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'bg-orange-50 dark:bg-orange-900/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          stats.financialSummary.balance >= 0
                            ? 'bg-blue-100 dark:bg-blue-900/40'
                            : 'bg-orange-100 dark:bg-orange-900/40'
                        }`}
                      >
                        <svg
                          className={`w-6 h-6 ${
                            stats.financialSummary.balance >= 0
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className={`text-xs font-medium ${
                            stats.financialSummary.balance >= 0
                              ? 'text-blue-900 dark:text-blue-300'
                              : 'text-orange-900 dark:text-orange-300'
                          }`}
                        >
                          Balance
                        </p>
                        <p
                          className={`text-sm ${
                            stats.financialSummary.balance >= 0
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-orange-700 dark:text-orange-400'
                          }`}
                        >
                          {stats.financialSummary.balance >= 0 ? 'Superávit' : 'Déficit'}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-xl font-bold ${
                        stats.financialSummary.balance >= 0
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-orange-700 dark:text-orange-400'
                      }`}
                    >
                      ${Math.abs(stats.financialSummary.balance).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              ) : (
                // Actividad reciente para super admins sin financial summary
                <>
                  {stats?.recentActivity && (
                    <>
                      {stats.recentActivity.newUsers && stats.recentActivity.newUsers > 0 ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {stats.recentActivity.newUsers} nuevo(s) usuario(s) registrado(s)
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Últimos 7 días
                            </p>
                          </div>
                        </div>
                      ) : null}
                      {stats.recentActivity.newVisitors && stats.recentActivity.newVisitors > 0 ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {stats.recentActivity.newVisitors} nueva(s) visita(s) registrada(s)
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Últimos 7 días
                            </p>
                          </div>
                        </div>
                      ) : null}
                      {stats.recentActivity.newParcels && stats.recentActivity.newParcels > 0 ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {stats.recentActivity.newParcels} nueva(s) encomienda(s) recibida(s)
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Últimos 7 días
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                  {(!stats?.recentActivity ||
                    (!stats.recentActivity.newUsers &&
                      !stats.recentActivity.newVisitors &&
                      !stats.recentActivity.newParcels)) && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay actividad reciente para mostrar
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Documentos de la comunidad */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Documentos de la comunidad
            </h3>
            <div className="space-y-3">
              {/* Documento mock 1 - Reunión de comunidad */}
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Acta de reunión enero 2024
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Reuniones
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">PDF · 2.4 MB</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Documento mock 2 - Reglamento interno */}
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Reglamento de copropiedad
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      Legal
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">PDF · 1.8 MB</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Ver todos los documentos */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  Ver todos los documentos →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de pagos mensuales - Solo para residentes */}
        {isResident && stats?.monthlyPayments && stats.monthlyPayments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Historial de Pagos de Gastos Comunes (Últimos 12 Meses)
            </h3>
            <div className="w-full">
              {/* Gráfico de barras SVG */}
              <div className="relative" style={{ height: '300px' }}>
                <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  {/* Líneas de fondo (grid) */}
                  <line
                    x1="0"
                    y1="250"
                    x2="1000"
                    y2="250"
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="1"
                  />
                  <line
                    x1="0"
                    y1="187.5"
                    x2="1000"
                    y2="187.5"
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                  <line
                    x1="0"
                    y1="125"
                    x2="1000"
                    y2="125"
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                  <line
                    x1="0"
                    y1="62.5"
                    x2="1000"
                    y2="62.5"
                    stroke="currentColor"
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />

                  {/* Barras */}
                  {(() => {
                    const maxAmount = Math.max(...stats.monthlyPayments!.map((m) => m.amount));
                    const barWidth = 1000 / stats.monthlyPayments!.length;
                    const padding = barWidth * 0.2;

                    return stats.monthlyPayments!.map((data, index) => {
                      const barHeight = maxAmount > 0 ? (data.amount / maxAmount) * 230 : 0;
                      const x = index * barWidth + padding;
                      const y = 250 - barHeight;
                      const width = barWidth - padding * 2;

                      return (
                        <g key={data.month}>
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={barHeight}
                            fill="currentColor"
                            className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                            rx="4"
                          />
                        </g>
                      );
                    });
                  })()}
                </svg>

                {/* Etiquetas de meses */}
                <div className="flex justify-between mt-2">
                  {stats.monthlyPayments.map((data) => {
                    const [year, month] = data.month.split('-');
                    const monthNames = [
                      'Ene',
                      'Feb',
                      'Mar',
                      'Abr',
                      'May',
                      'Jun',
                      'Jul',
                      'Ago',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dic',
                    ];
                    const monthName = monthNames[parseInt(month) - 1];

                    return (
                      <div key={data.month} className="flex-1 text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400">{monthName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{year}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Valores de montos */}
                <div className="flex justify-between mt-4">
                  {stats.monthlyPayments.map((data) => (
                    <div key={data.month} className="flex-1 text-center">
                      {data.amount > 0 && (
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          ${data.amount.toLocaleString('es-CL')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Pagado</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    $
                    {stats.monthlyPayments
                      .reduce((sum, m) => sum + m.amount, 0)
                      .toLocaleString('es-CL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Promedio Mensual</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    $
                    {(() => {
                      const monthsWithPayment = stats.monthlyPayments.filter(
                        (m) => m.amount > 0,
                      ).length;
                      if (monthsWithPayment === 0) return '0';
                      const total = stats.monthlyPayments.reduce((sum, m) => sum + m.amount, 0);
                      return Math.round(total / monthsWithPayment).toLocaleString('es-CL');
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Meses con Pago</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats.monthlyPayments.filter((m) => m.amount > 0).length} / 12
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información básica de la comunidad - Solo para Community Admin */}
        {isCommunityAdmin &&
          currentCommunity &&
          stats?.communities &&
          (() => {
            const communityData = stats.communities.find((c) => c.id === currentCommunity.id);
            return (
              communityData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Información de la Comunidad
                  </h3>
                  <div>
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                            {communityData.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {communityData.address}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            communityData.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {communityData.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Tipo de Comunidad */}
                        {communityData.type && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                              <svg
                                className="w-5 h-5 text-purple-600 dark:text-purple-400"
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
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {communityData.type === 'CONDOMINIUM'
                                  ? 'Condominio'
                                  : communityData.type === 'APARTMENT_BUILDING'
                                    ? 'Edificio de Apartamentos'
                                    : communityData.type === 'RESIDENTIAL_COMPLEX'
                                      ? 'Complejo Residencial'
                                      : communityData.type === 'GATED_COMMUNITY'
                                        ? 'Comunidad Cerrada'
                                        : communityData.type}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Total de Unidades */}
                        {communityData.totalUnits && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                              <svg
                                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Total Unidades
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {communityData.totalUnits}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Pisos */}
                        {communityData.floors && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                              <svg
                                className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
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
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Pisos</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {communityData.floors}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Año de Construcción */}
                        {communityData.constructionYear && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                              <svg
                                className="w-5 h-5 text-orange-600 dark:text-orange-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Año Construcción
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {communityData.constructionYear}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Teléfono */}
                        {communityData.phone && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                              <svg
                                className="w-5 h-5 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {communityData.phone}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Email */}
                        {communityData.email && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                              <svg
                                className="w-5 h-5 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                                {communityData.email}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Website */}
                        {communityData.website && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 p-2 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg">
                              <svg
                                className="w-5 h-5 text-cyan-600 dark:text-cyan-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sitio Web</p>
                              <a
                                href={communityData.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-all"
                              >
                                {communityData.website}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Descripción (si existe) */}
                        {communityData.description && (
                          <div className="col-span-full">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Descripción
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {communityData.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            );
          })()}
      </div>
    </ProtectedRoute>
  );
}
