'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ConciergeService, Reservation } from '@/services/concierge.service';
import { useAuth } from '@/hooks/useAuth';

export default function ReservasPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Obtener comunidad del conserje desde el token
  const isConcierge = user?.roles?.some((role) => role.name === 'CONCIERGE');
  const conciergeCommunityId = isConcierge ? user?.communities?.[0]?.id : undefined;
  const conciergeCommunityName = isConcierge ? user?.communities?.[0]?.name : undefined;

  useEffect(() => {
    if (isLoadingUser) {
      return;
    }

    if (conciergeCommunityId) {
      loadReservations();
    } else {
      setLoading(false);
      if (isConcierge && !conciergeCommunityId) {
        setError('No tienes una comunidad asignada. Contacta al administrador.');
      }
    }
  }, [conciergeCommunityId, isLoadingUser, isConcierge]);

  const loadReservations = async () => {
    if (!conciergeCommunityId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await ConciergeService.getReservations(conciergeCommunityId);
      setReservations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error cargando reservas:', err);
      setError(err.message || 'Error al cargar las reservas');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar reservas
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesSearch =
        reservation.unit?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.commonSpace?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.unit?.userUnits?.[0]?.user?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: reservations.length,
      pending: reservations.filter((r) => r.status === 'PENDING').length,
      confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
      cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
    };
  }, [reservations]);

  // Mostrar loading mientras se carga el usuario
  if (isLoadingUser) {
    return (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['CONCIERGE']}>
          <DashboardLayout>
            <div className="p-6">
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </DashboardLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  // Si no hay comunidad del conserje, mostrar mensaje de error
  if (!conciergeCommunityId) {
    return (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['CONCIERGE']}>
          <DashboardLayout>
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                  No se encontró ninguna comunidad asignada
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  No tienes acceso a ninguna comunidad. Por favor, contacta al administrador para
                  que te asigne una comunidad.
                </p>
              </div>
            </div>
          </DashboardLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['CONCIERGE']}>
        <DashboardLayout>
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Reservas de Espacios Comunes
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Gestiona todas las reservas de{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {conciergeCommunityName || 'tu comunidad'}
                  </span>
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {stats.total}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                      Pendientes
                    </p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <svg
                      className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Confirmadas
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {stats.confirmed}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Canceladas</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {stats.cancelled}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    🔍 Buscar
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por unidad, espacio común o residente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📊 Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="CONFIRMED">Confirmadas</option>
                    <option value="CANCELLED">Canceladas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">❌</div>
                  <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Tabla de reservas */}
            {loading ? (
              <div className="flex flex-col justify-center items-center py-16 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Cargando reservas...
                </h3>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No hay reservas disponibles
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No se encontraron reservas con los filtros seleccionados.'
                    : 'Aún no se han creado reservas en esta comunidad.'}
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                          Espacio Común
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                          Unidad
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                          Residente
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                          Horario
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredReservations.map((reservation) => {
                        const reservationDate = new Date(reservation.reservationDate);
                        const residents =
                          reservation.unit?.userUnits?.map((uu) => uu.user.name).join(', ') ||
                          'Sin residentes';

                        return (
                          <tr
                            key={reservation.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
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
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {reservation.commonSpace?.name || 'N/A'}
                                  </div>
                                  {reservation.commonSpace?.description && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {reservation.commonSpace.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                Unidad {reservation.unit?.number || 'N/A'}
                              </div>
                              {reservation.unit?.floor && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Piso {reservation.unit.floor}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {residents}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {reservationDate.toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {reservation.startTime} - {reservation.endTime}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  reservation.status === 'CONFIRMED'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : reservation.status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}
                              >
                                {reservation.status === 'CONFIRMED' && '✅ '}
                                {reservation.status === 'PENDING' && '⏳ '}
                                {reservation.status === 'CANCELLED' && '❌ '}
                                {reservation.status === 'CONFIRMED'
                                  ? 'Confirmada'
                                  : reservation.status === 'PENDING'
                                    ? 'Pendiente'
                                    : 'Cancelada'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
