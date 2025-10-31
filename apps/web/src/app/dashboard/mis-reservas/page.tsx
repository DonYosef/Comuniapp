'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  ResidentsService,
  Reservation,
  CommonSpace,
  CreateReservationRequest,
  UserUnit,
} from '@/services/residents.service';
import { useAuth } from '@/hooks/useAuth';

export default function MisReservasPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commonSpaces, setCommonSpaces] = useState<CommonSpace[]>([]);
  const [userUnits, setUserUnits] = useState<UserUnit[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Formulario de nueva reserva
  const [formData, setFormData] = useState<CreateReservationRequest>({
    commonSpaceId: '',
    unitId: '',
    reservationDate: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    if (!isLoadingUser && user) {
      loadReservations();
      loadCommonSpaces();
      loadUserUnits();
    }
  }, [isLoadingUser, user]);

  const loadCommonSpaces = async () => {
    setIsLoadingSpaces(true);
    try {
      const data = await ResidentsService.getMyCommonSpaces();
      setCommonSpaces(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error cargando espacios comunes:', err);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const loadUserUnits = async () => {
    try {
      const data = await ResidentsService.getMyUnits();
      setUserUnits(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error cargando unidades:', err);
    }
  };

  const loadReservations = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await ResidentsService.getMyReservations();
      setReservations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error cargando reservas:', err);
      setError(err.message || 'Error al cargar las reservas');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setCreateError(null);
    setFormData({
      commonSpaceId: '',
      unitId: '',
      reservationDate: '',
      startTime: '',
      endTime: '',
    });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
    setFormData({
      commonSpaceId: '',
      unitId: '',
      reservationDate: '',
      startTime: '',
      endTime: '',
    });
  };

  const handleCreateReservation = async () => {
    if (
      !formData.commonSpaceId ||
      !formData.unitId ||
      !formData.reservationDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setCreateError('Por favor completa todos los campos requeridos');
      return;
    }

    // Validar que la hora de fin sea después de la hora de inicio
    if (formData.endTime <= formData.startTime) {
      setCreateError('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Validar que la fecha no sea en el pasado
    const selectedDate = new Date(formData.reservationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setCreateError('No puedes reservar para fechas pasadas');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await ResidentsService.createReservation(formData);
      setToast({
        message: 'Solicitud de reserva creada exitosamente. El conserje revisará tu solicitud.',
        type: 'success',
      });
      handleCloseCreateModal();
      await loadReservations();
    } catch (err: any) {
      console.error('Error creando reserva:', err);
      setCreateError(err.message || 'Error al crear la solicitud de reserva');
    } finally {
      setIsCreating(false);
    }
  };

  // Filtrar espacios comunes y unidades según la unidad seleccionada
  const filteredCommonSpaces = useMemo(() => {
    if (!formData.unitId) return commonSpaces;
    const selectedUnit = userUnits.find((uu) => uu.unit.id === formData.unitId);
    if (!selectedUnit) return commonSpaces;
    return commonSpaces.filter((space) => space.communityId === selectedUnit.unit.community.id);
  }, [formData.unitId, commonSpaces, userUnits]);

  // Filtrar reservas
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesSearch =
        reservation.unit?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.commonSpace?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.unit?.community?.name?.toLowerCase().includes(searchTerm.toLowerCase());

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
        <RoleGuard allowedRoles={['RESIDENT']}>
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

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['RESIDENT']}>
        <DashboardLayout>
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Mis Reservas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Consulta y solicita reservas de espacios comunes registradas a tu nombre
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Nueva Solicitud
                </button>
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
                    placeholder="Buscar por espacio común, unidad o comunidad..."
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
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                    <button
                      onClick={loadReservations}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline mt-2"
                    >
                      🔄 Reintentar
                    </button>
                  </div>
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
                    : 'Aún no tienes reservas registradas. Contacta al conserje para realizar una reserva.'}
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
                          Comunidad
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
                                {reservation.unit?.community?.name || 'N/A'}
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

            {/* Modal para crear reserva */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Nueva Solicitud de Reserva
                    </h2>
                    <button
                      onClick={handleCloseCreateModal}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    {createError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200 text-sm">{createError}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Unidad <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.unitId}
                        onChange={(e) =>
                          setFormData({ ...formData, unitId: e.target.value, commonSpaceId: '' })
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                        required
                      >
                        <option value="">Selecciona una unidad</option>
                        {userUnits.map((userUnit) => (
                          <option key={userUnit.id} value={userUnit.unit.id}>
                            Unidad {userUnit.unit.number}
                            {userUnit.unit.floor && ` - Piso ${userUnit.unit.floor}`} (
                            {userUnit.unit.community.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Espacio Común <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.commonSpaceId}
                        onChange={(e) =>
                          setFormData({ ...formData, commonSpaceId: e.target.value })
                        }
                        disabled={!formData.unitId || isLoadingSpaces}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">
                          {!formData.unitId
                            ? 'Primero selecciona una unidad'
                            : isLoadingSpaces
                              ? 'Cargando espacios...'
                              : 'Selecciona un espacio común'}
                        </option>
                        {filteredCommonSpaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name}
                            {space.description && ` - ${space.description}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de Reserva <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.reservationDate}
                        onChange={(e) =>
                          setFormData({ ...formData, reservationDate: e.target.value })
                        }
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Hora de Inicio <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Hora de Fin <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-semibold mb-1">Importante:</p>
                          <p>
                            Tu solicitud será revisada por el conserje. Una vez aprobada, recibirás
                            una confirmación. El estado inicial será "Pendiente".
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                    <button
                      onClick={handleCloseCreateModal}
                      disabled={isCreating}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateReservation}
                      disabled={isCreating}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {isCreating ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4"
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
                          Creando...
                        </span>
                      ) : (
                        'Crear Solicitud'
                      )}
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
