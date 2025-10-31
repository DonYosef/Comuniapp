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
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

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

  const handleOpenManageModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowManageModal(true);
  };

  const handleCloseManageModal = () => {
    setShowManageModal(false);
    setSelectedReservation(null);
  };

  const handleUpdateStatus = async (reservationId: string, newStatus: string) => {
    if (!conciergeCommunityId) return;

    setUpdatingStatus(reservationId);
    setToast(null);

    try {
      await ConciergeService.updateReservationStatus(reservationId, newStatus);
      setToast({
        message: `Estado de reserva actualizado a ${newStatus === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'} exitosamente`,
        type: 'success',
      });
      // Cerrar el modal después de actualizar
      handleCloseManageModal();
      // Recargar las reservas para reflejar el cambio
      await loadReservations();
    } catch (err: any) {
      console.error('Error actualizando estado de reserva:', err);
      setToast({
        message: err.message || 'Error al actualizar el estado de la reserva',
        type: 'error',
      });
    } finally {
      setUpdatingStatus(null);
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

            {/* Toast de notificaciones */}
            {toast && (
              <div
                className={`border-2 rounded-xl p-4 shadow-lg flex items-center justify-between ${
                  toast.type === 'success'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                    : toast.type === 'error'
                      ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
                  </div>
                  <p
                    className={`font-medium ${
                      toast.type === 'success'
                        ? 'text-green-800 dark:text-green-200'
                        : toast.type === 'error'
                          ? 'text-red-800 dark:text-red-200'
                          : 'text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => setToast(null)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                          Acciones
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              {reservation.status === 'PENDING' ||
                              reservation.status === 'CONFIRMED' ||
                              reservation.status === 'CANCELLED' ? (
                                <button
                                  onClick={() => handleOpenManageModal(reservation)}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                  title="Gestionar reserva"
                                >
                                  <svg
                                    className="w-3 h-3 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                    />
                                  </svg>
                                  Gestionar
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  No editable
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal de gestión de reserva */}
            {showManageModal && selectedReservation && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full transform transition-all animate-slideUp">
                  {/* Header con gradiente */}
                  <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl px-6 py-5 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Gestionar Reserva</h2>
                        <p className="text-sm text-blue-100">Actualiza el estado de la reserva</p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseManageModal}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                    >
                      <svg
                        className="w-6 h-6"
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
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Información de la reserva con cards mejoradas */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/50 space-y-5">
                      {/* Espacio Común */}
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
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
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                              Espacio Común
                            </p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {selectedReservation.commonSpace?.name || 'N/A'}
                            </p>
                            {selectedReservation.commonSpace?.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {selectedReservation.commonSpace.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Grid de información */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Unidad */}
                        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
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
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              Unidad
                            </p>
                          </div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {selectedReservation.unit?.number || 'N/A'}
                            {selectedReservation.unit?.floor && (
                              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                                Piso {selectedReservation.unit.floor}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Residente */}
                        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              Residente
                            </p>
                          </div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {selectedReservation.unit?.userUnits?.[0]?.user?.name || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Fecha y Horario */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Fecha */}
                        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              Fecha
                            </p>
                          </div>
                          <p className="text-base font-bold text-gray-900 dark:text-white">
                            {new Date(selectedReservation.reservationDate).toLocaleDateString(
                              'es-ES',
                              {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              },
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(selectedReservation.reservationDate).toLocaleDateString(
                              'es-ES',
                              { year: 'numeric' },
                            )}
                          </p>
                        </div>

                        {/* Horario */}
                        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              Horario
                            </p>
                          </div>
                          <p className="text-base font-bold text-gray-900 dark:text-white">
                            {selectedReservation.startTime} - {selectedReservation.endTime}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Duración: ~
                            {(() => {
                              const start = selectedReservation.startTime.split(':');
                              const end = selectedReservation.endTime.split(':');
                              const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
                              const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
                              const diff = endMinutes - startMinutes;
                              const hours = Math.floor(diff / 60);
                              const minutes = diff % 60;
                              return hours > 0
                                ? `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`
                                : `${minutes}min`;
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Estado Actual */}
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              Estado Actual
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                              selectedReservation.status === 'CONFIRMED'
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                                : selectedReservation.status === 'PENDING'
                                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
                                  : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {selectedReservation.status === 'CONFIRMED' && '✅ '}
                            {selectedReservation.status === 'PENDING' && '⏳ '}
                            {selectedReservation.status === 'CANCELLED' && '❌ '}
                            {selectedReservation.status === 'CONFIRMED'
                              ? 'Confirmada'
                              : selectedReservation.status === 'PENDING'
                                ? 'Pendiente'
                                : 'Cancelada'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones disponibles */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 dark:via-blue-700 to-transparent"></div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide px-3">
                          Acciones Disponibles
                        </p>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 dark:via-blue-700 to-transparent"></div>
                      </div>

                      {selectedReservation.status === 'PENDING' && (
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => handleUpdateStatus(selectedReservation.id, 'CONFIRMED')}
                            disabled={updatingStatus === selectedReservation.id}
                            className="group relative flex flex-col items-center justify-center px-6 py-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-2xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                          >
                            {updatingStatus === selectedReservation.id ? (
                              <div className="flex items-center gap-2 z-10">
                                <svg
                                  className="animate-spin h-5 w-5 text-green-700 dark:text-green-300"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span className="text-green-900 dark:text-green-100">
                                  Procesando...
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 z-10">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                  <svg
                                    className="w-6 h-6 text-green-600 dark:text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                                <span className="text-lg text-green-800 dark:text-green-200">
                                  Confirmar
                                </span>
                                <span className="text-xs text-green-700 dark:text-green-300 opacity-90">
                                  Aprobar solicitud
                                </span>
                              </div>
                            )}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedReservation.id, 'CANCELLED')}
                            disabled={updatingStatus === selectedReservation.id}
                            className="group relative flex flex-col items-center justify-center px-6 py-5 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/40 dark:hover:to-rose-900/40 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
                          >
                            {updatingStatus === selectedReservation.id ? (
                              <div className="flex items-center gap-2 z-10">
                                <svg
                                  className="animate-spin h-5 w-5 text-red-700 dark:text-red-300"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span className="text-red-900 dark:text-red-100">
                                  Procesando...
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 z-10">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                                  <svg
                                    className="w-6 h-6 text-red-600 dark:text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </div>
                                <span className="text-lg text-red-800 dark:text-red-200">
                                  Rechazar
                                </span>
                                <span className="text-xs text-red-700 dark:text-red-300 opacity-90">
                                  Denegar solicitud
                                </span>
                              </div>
                            )}
                          </button>
                        </div>
                      )}

                      {selectedReservation.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedReservation.id, 'CANCELLED')}
                          disabled={updatingStatus === selectedReservation.id}
                          className="group relative w-full flex items-center justify-center px-6 py-5 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/40 dark:hover:to-rose-900/40 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:hover:scale-100 overflow-hidden"
                        >
                          {updatingStatus === selectedReservation.id ? (
                            <div className="flex items-center gap-3 z-10">
                              <svg
                                className="animate-spin h-5 w-5 text-red-700 dark:text-red-300"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span className="text-base text-red-900 dark:text-red-100">
                                Cancelando reserva...
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 z-10">
                              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-red-600 dark:text-red-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </div>
                              <span className="text-base text-red-800 dark:text-red-200">
                                Cancelar Reserva
                              </span>
                            </div>
                          )}
                        </button>
                      )}

                      {selectedReservation.status === 'CANCELLED' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedReservation.id, 'CONFIRMED')}
                          disabled={updatingStatus === selectedReservation.id}
                          className="group relative w-full flex items-center justify-center px-6 py-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-2xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:hover:scale-100 overflow-hidden"
                        >
                          {updatingStatus === selectedReservation.id ? (
                            <div className="flex items-center gap-3 z-10">
                              <svg
                                className="animate-spin h-5 w-5 text-green-700 dark:text-green-300"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span className="text-base text-green-900 dark:text-green-100">
                                Reactivando reserva...
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 z-10">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-green-600 dark:text-green-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                              <span className="text-base text-green-800 dark:text-green-200">
                                Reactivar Reserva
                              </span>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
                    <button
                      onClick={handleCloseManageModal}
                      disabled={updatingStatus === selectedReservation.id}
                      className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
