'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  ConciergeService,
  CommonSpace,
  Unit,
  CreateReservationRequest,
} from '@/services/concierge.service';
import { useAuth } from '@/hooks/useAuth';

export default function ReservarEspacioPage() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const [commonSpaces, setCommonSpaces] = useState<CommonSpace[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Obtener comunidad del conserje desde el token (igual que visitas y encomiendas)
  const isConcierge = user?.roles?.some((role) => role.name === 'CONCIERGE');
  const conciergeCommunityId = isConcierge ? user?.communities?.[0]?.id : undefined;
  const conciergeCommunityName = isConcierge ? user?.communities?.[0]?.name : undefined;

  const [formData, setFormData] = useState<CreateReservationRequest>({
    commonSpaceId: '',
    unitId: '',
    reservationDate: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    // Esperar a que el usuario termine de cargar antes de verificar la comunidad
    if (isLoadingUser) {
      console.log('⏳ [ReservarEspacio] Esperando a que cargue el usuario...');
      return;
    }

    if (conciergeCommunityId) {
      console.log(
        '🔄 [ReservarEspacio] Cargando datos para comunidad:',
        conciergeCommunityId,
        conciergeCommunityName,
      );
      loadData();
    } else {
      console.log('⚠️ [ReservarEspacio] No hay comunidad del conserje disponible');
      setLoading(false);
      if (isConcierge && !conciergeCommunityId) {
        setError('No tienes una comunidad asignada. Contacta al administrador.');
      }
    }
  }, [conciergeCommunityId, isLoadingUser, isConcierge]);

  const loadData = async () => {
    if (!conciergeCommunityId) {
      console.warn('⚠️ [ReservarEspacio] loadData llamado sin conciergeCommunityId');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 [ReservarEspacio] Iniciando peticiones a API...');
      console.log('📡 [ReservarEspacio] Comunidad ID:', conciergeCommunityId);
      console.log('📡 [ReservarEspacio] Comunidad Name:', conciergeCommunityName);

      const [spacesData, unitsData] = await Promise.all([
        ConciergeService.getCommonSpaces(conciergeCommunityId),
        ConciergeService.getUnits(conciergeCommunityId),
      ]);

      console.log('✅ [ReservarEspacio] Datos recibidos:');
      console.log(
        '  - Espacios comunes:',
        Array.isArray(spacesData) ? spacesData.length : 'NO ES ARRAY',
        spacesData,
      );
      console.log(
        '  - Unidades:',
        Array.isArray(unitsData) ? unitsData.length : 'NO ES ARRAY',
        unitsData,
      );

      // Asegurar que siempre sean arrays
      const safeSpaces = Array.isArray(spacesData) ? spacesData : [];
      const safeUnits = Array.isArray(unitsData) ? unitsData : [];

      setCommonSpaces(safeSpaces);
      setUnits(safeUnits);

      if (safeSpaces.length === 0) {
        console.warn('⚠️ [ReservarEspacio] No se encontraron espacios comunes');
      }
      if (safeUnits.length === 0) {
        console.warn('⚠️ [ReservarEspacio] No se encontraron unidades');
      }
    } catch (err: any) {
      console.error('❌ [ReservarEspacio] Error cargando datos:', err);
      console.error('❌ [ReservarEspacio] Detalles del error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });

      let errorMessage = 'Error al cargar los datos';
      if (err.response?.status === 403) {
        errorMessage = 'No tienes permisos para ver espacios comunes o unidades en esta comunidad';
      } else if (err.response?.status === 404) {
        errorMessage = 'Comunidad no encontrada';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      // Asegurar que sean arrays incluso en caso de error
      setCommonSpaces([]);
      setUnits([]);
    } finally {
      setLoading(false);
      console.log('✅ [ReservarEspacio] loadData completado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      await ConciergeService.createReservation(formData);
      setSuccess(true);
      setFormData({
        commonSpaceId: '',
        unitId: '',
        reservationDate: '',
        startTime: '',
        endTime: '',
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error creando reserva:', err);
      setError(err.message || 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Asegurar que siempre sean arrays antes de usar .find()
  const safeCommonSpaces = Array.isArray(commonSpaces) ? commonSpaces : [];
  const safeUnits = Array.isArray(units) ? units : [];

  const selectedSpace = safeCommonSpaces.find((space) => space.id === formData.commonSpaceId);
  const selectedUnit = safeUnits.find((unit) => unit.id === formData.unitId);

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

  // Si no hay comunidad del conserje (después de que cargue el usuario), mostrar mensaje de error
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
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header mejorado con gradiente */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Registrar Reserva de Espacio Común
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Crea una reserva de espacio común para un residente de{' '}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Mensajes de estado mejorados */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg animate-fade-in-down">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">❌</div>
                    <div className="flex-1">
                      <p className="text-red-800 dark:text-red-200 font-medium mb-1">{error}</p>
                      <button
                        onClick={() => {
                          console.log('🔄 [ReservarEspacio] Recargando datos manualmente...');
                          if (conciergeCommunityId) {
                            loadData();
                          }
                        }}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline mt-2"
                      >
                        🔄 Reintentar cargar datos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 shadow-lg animate-fade-in-down">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✅</div>
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    Reserva creada exitosamente
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col justify-center items-center py-16 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Cargando datos...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Obteniendo espacios comunes y unidades disponibles
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 animate-fade-in-up"
              >
                <div className="space-y-6">
                  {/* Espacio Común */}
                  <div>
                    <label
                      htmlFor="commonSpaceId"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                    >
                      Espacio Común <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="commonSpaceId"
                      name="commonSpaceId"
                      value={formData.commonSpaceId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                    >
                      <option value="">Selecciona un espacio común</option>
                      {safeCommonSpaces.length === 0 ? (
                        <option value="" disabled>
                          No hay espacios comunes disponibles
                        </option>
                      ) : (
                        safeCommonSpaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name} {space.description && `- ${space.description}`}
                          </option>
                        ))
                      )}
                    </select>
                    {safeCommonSpaces.length === 0 && !loading && (
                      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                        ⚠️ No se encontraron espacios comunes. Verifica que existan espacios comunes
                        activos en la comunidad.
                      </p>
                    )}
                    {selectedSpace &&
                      selectedSpace.schedules &&
                      selectedSpace.schedules.length > 0 && (
                        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                            📅 Horarios disponibles:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedSpace.schedules.map((schedule, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                              >
                                {schedule.dayOfWeek} {schedule.startTime}-{schedule.endTime}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Unidad/Residente */}
                  <div>
                    <label
                      htmlFor="unitId"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                    >
                      Unidad / Residente <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="unitId"
                      name="unitId"
                      value={formData.unitId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 text-sm"
                    >
                      <option value="">Selecciona una unidad</option>
                      {safeUnits.length === 0 ? (
                        <option value="" disabled>
                          No hay unidades disponibles
                        </option>
                      ) : (
                        safeUnits.map((unit) => {
                          const unitNumber = unit.number;
                          const floorInfo = unit.floor ? `Piso ${unit.floor}` : '';
                          const residents =
                            unit.userUnits && unit.userUnits.length > 0
                              ? unit.userUnits.map((uu) => uu.user.name).join(', ')
                              : 'Sin residentes';

                          // Formato más legible: "Unidad 101 - Piso 1 | Juan Pérez, María González"
                          const displayText = [`Unidad ${unitNumber}`, floorInfo, `| ${residents}`]
                            .filter(Boolean)
                            .join(' - ');

                          return (
                            <option key={unit.id} value={unit.id}>
                              {displayText}
                            </option>
                          );
                        })
                      )}
                    </select>
                    {safeUnits.length === 0 && !loading && (
                      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                        ⚠️ No se encontraron unidades. Verifica que existan unidades activas con
                        residentes confirmados en la comunidad.
                      </p>
                    )}
                    {safeUnits.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        💡 Formato: Unidad - Piso | Residentes
                      </p>
                    )}
                  </div>

                  {/* Fecha */}
                  <div>
                    <label
                      htmlFor="reservationDate"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                    >
                      Fecha de Reserva <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="reservationDate"
                      name="reservationDate"
                      value={formData.reservationDate}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                    />
                  </div>

                  {/* Horarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="startTime"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                      >
                        Hora de Inicio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="endTime"
                        className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                      >
                        Hora de Fin <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>

                  {/* Resumen mejorado */}
                  {formData.commonSpaceId && formData.unitId && formData.reservationDate && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200">
                          Resumen de la Reserva
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                            Espacio
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedSpace?.name}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                            Unidad
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Unidad {selectedUnit?.number}
                            {selectedUnit?.userUnits && selectedUnit.userUnits.length > 0 && (
                              <span className="text-gray-600 dark:text-gray-400">
                                {' '}
                                - {selectedUnit.userUnits.map((uu) => uu.user.name).join(', ')}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                            Fecha
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(formData.reservationDate).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                            Horario
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formData.startTime} - {formData.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botones mejorados */}
                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          commonSpaceId: '',
                          unitId: '',
                          reservationDate: '',
                          startTime: '',
                          endTime: '',
                        });
                        setError(null);
                        setSuccess(false);
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-semibold"
                    >
                      <svg
                        className="w-5 h-5"
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
                      Limpiar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Creando...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Crear Reserva</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
