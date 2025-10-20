'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  VisitModal,
  StatusBadge,
  useVisits,
  Toast,
  VisitFormData,
} from '@/components/visitas/VisitComponents';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCommunities } from '@/hooks/useCommunities';
import { useUnits } from '@/hooks/useUnits';
import { VisitorsService, VisitorResponse } from '@/services/visitors.service';

// Iconos SVG
const VisitIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
    />
  </svg>
);

interface VisitItem {
  id: string;
  visitorName: string;
  visitorId: string;
  visitorPhone?: string;
  visitorEmail?: string;
  unitId: string;
  residentName: string;
  residentPhone?: string;
  visitPurpose: 'personal' | 'business' | 'maintenance' | 'delivery' | 'other';
  expectedArrival: string;
  expectedDeparture: string;
  vehicleInfo?: string;
  notes?: string;
  status: 'SCHEDULED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
  arrivalTime?: Date;
  departureTime?: Date;
  communityName: string;
}

// Datos mock para visitas - ELIMINADOS
// Los datos de prueba han sido removidos para mostrar solo datos reales de la API

interface DynamicVisitsViewProps {
  isResidentView?: boolean;
}

export default function DynamicVisitsView({ isResidentView = false }: DynamicVisitsViewProps) {
  const { user, isAdmin } = useAuth();

  // Determinar si es vista de residente basado en el rol o prop
  const isResident = isResidentView || user?.roles?.some((role) => role.name === 'RESIDENT');

  // Solo cargar comunidades si NO es residente
  const { isLoading: communitiesLoading, error: communitiesError, communities } = useCommunities();
  const { createVisit, markAsArrived, markAsCompleted } = useVisits();
  const [visits, setVisits] = useState<VisitorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitFormData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  console.log('🔍 [DynamicVisitsView] user:', user);
  console.log('🔍 [DynamicVisitsView] isResident:', isResident);
  console.log('🔍 [DynamicVisitsView] user.userUnits:', user?.userUnits);

  // Obtener la comunidad del usuario (solo para admins)
  const userCommunity = isResident ? null : communities?.[0];
  console.log('🔍 [DynamicVisitsView] communities:', communities);
  console.log('🔍 [DynamicVisitsView] userCommunity:', userCommunity);
  const { units, isLoading: unitsLoading } = useUnits(userCommunity?.id);
  console.log('🔍 [DynamicVisitsView] units:', units);

  // Cargar visitas desde la API
  useEffect(() => {
    const fetchVisits = async () => {
      // Para residentes, no necesitamos userCommunity, solo user.userUnits
      // Para admins, necesitamos userCommunity
      if (!isResident && !userCommunity) return;

      setIsLoading(true);
      try {
        let visitsData;
        if (isResident) {
          // Para residentes, obtener todas las visitas (el backend ya filtra por las unidades del usuario)
          console.log('👥 [fetchVisits] Resident user - fetching visits (backend will filter)');
          console.log('🔍 [fetchVisits] Calling VisitorsService.getVisitors()...');
          visitsData = await VisitorsService.getVisitors();
          console.log('🔍 [fetchVisits] VisitorsService.getVisitors() response:', visitsData);
        } else {
          // Para admins, obtener todas las visitas
          console.log('👑 [fetchVisits] Admin user - fetching all visits');
          visitsData = await VisitorsService.getVisitors();
        }

        console.log('👥 Total visits loaded:', visitsData.length);
        setVisits(visitsData);
      } catch (error) {
        console.error('Error fetching visits:', error);
        setToast({
          message: 'Error al cargar las visitas',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
  }, [userCommunity, user, isResident]);

  // Convertir datos reales de la API a formato de visualización
  let allVisits: VisitItem[] = visits.map((v) => ({
    id: v.id,
    visitorName: v.visitorName,
    visitorId: v.visitorDocument,
    visitorPhone: v.visitorPhone,
    visitorEmail: v.visitorEmail,
    unitId: v.unitNumber,
    residentName: v.residentName || 'No especificado',
    residentPhone: v.residentPhone,
    visitPurpose: v.visitPurpose as any,
    expectedArrival: v.expectedArrival,
    expectedDeparture: v.expectedDeparture,
    vehicleInfo: v.vehicleInfo,
    notes: v.notes,
    status: v.status,
    arrivalTime: v.entryDate ? new Date(v.entryDate) : undefined,
    departureTime: v.exitDate ? new Date(v.exitDate) : undefined,
    communityName: v.communityName,
  }));

  // Nota: Ya no necesitamos filtrar por unidad aquí porque la API ya devuelve solo las visitas relevantes
  // para cada tipo de usuario (residente vs admin)

  // Filtrar visitas
  const filteredVisits = allVisits.filter((visit) => {
    const matchesSearch =
      visit.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitorId.includes(searchTerm) ||
      visit.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.unitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.residentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateVisit = async (data: VisitFormData) => {
    try {
      // Agregar el hostUserId del usuario autenticado
      const visitData = {
        ...data,
        hostUserId: user?.id || '',
      };

      await createVisit(visitData);
      setShowCreateForm(false);
      setToast({
        message: 'Visita registrada exitosamente',
        type: 'success',
      });

      // Recargar las visitas usando la misma lógica que el useEffect
      let visitsData;
      if (isResident) {
        // Para residentes, obtener todas las visitas (el backend ya filtra por las unidades del usuario)
        visitsData = await VisitorsService.getVisitors();
      } else {
        // Para admins, obtener todas las visitas
        visitsData = await VisitorsService.getVisitors();
      }
      setVisits(visitsData);
    } catch (error) {
      setToast({
        message: 'Error al registrar la visita',
        type: 'error',
      });
    }
  };

  const handleEditVisit = async (visit: VisitItem) => {
    try {
      setIsLoadingDetails(true);

      // Obtener los datos completos de la visita desde la API
      const { VisitorsService } = await import('@/services/visitors.service');
      const visitDetails = await VisitorsService.getVisitor(visit.id);

      console.log('🔍 [handleEditVisit] Visit details from API:', visitDetails);

      // Mapear los datos de la API al formato del formulario
      setEditingVisit({
        id: visitDetails.id,
        visitorName: visitDetails.visitorName,
        visitorId: visitDetails.visitorDocument, // Mapear visitorDocument a visitorId
        visitorPhone: visitDetails.visitorPhone || '',
        visitorEmail: visitDetails.visitorEmail || '',
        unitId: visitDetails.unitId,
        residentName: visitDetails.residentName || '',
        residentPhone: visitDetails.residentPhone || '',
        visitPurpose: visitDetails.visitPurpose,
        expectedArrival: visitDetails.expectedArrival
          ? new Date(visitDetails.expectedArrival).toISOString().slice(0, 16)
          : '',
        expectedDeparture: visitDetails.expectedDeparture
          ? new Date(visitDetails.expectedDeparture).toISOString().slice(0, 16)
          : '',
        vehicleInfo: visitDetails.vehicleInfo || '',
        notes: visitDetails.notes || '',
        hostUserId: visitDetails.hostUserId,
        status: visitDetails.status,
      });
    } catch (error) {
      console.error('Error loading visit details:', error);
      setToast({
        message: 'Error al cargar los detalles de la visita',
        type: 'error',
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleMarkAsArrived = async (id: string) => {
    try {
      await markAsArrived(id);
      setToast({
        message: 'Visita marcada como llegada',
        type: 'success',
      });

      // Recargar las visitas
      const visitsData = await VisitorsService.getVisitors();
      setVisits(visitsData);
    } catch (error) {
      setToast({
        message: 'Error al marcar como llegada',
        type: 'error',
      });
    }
  };

  const handleMarkAsCompleted = async (id: string) => {
    try {
      await markAsCompleted(id);
      setToast({
        message: 'Visita marcada como completada',
        type: 'success',
      });

      // Recargar las visitas
      const visitsData = await VisitorsService.getVisitors();
      setVisits(visitsData);
    } catch (error) {
      setToast({
        message: 'Error al marcar como completada',
        type: 'error',
      });
    }
  };

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setEditingVisit(null);
  };

  const getPurposeText = (purpose: string) => {
    const purposes = {
      personal: 'Personal',
      business: 'Negocios',
      maintenance: 'Mantenimiento',
      delivery: 'Entrega',
      other: 'Otro',
    };
    return purposes[purpose as keyof typeof purposes] || purpose;
  };

  if (communitiesLoading || isLoading || unitsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (communitiesError) {
    return <ErrorMessage message="Error al cargar las comunidades" />;
  }

  // Configuración dinámica basada en el tipo de vista
  const config = {
    title: isResident ? 'Tus Visitas' : 'Visitas',
    subtitle: isResident ? 'Ve las visitas a tu unidad' : 'Gestiona todas las visitas',
    buttonText: 'Registrar Visita',
    buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    listTitle: isResident ? 'Visitas a tu Unidad' : 'Todas las Visitas',
    emptyMessage: isResident ? 'No tienes visitas registradas.' : 'No hay visitas registradas.',
    showCreateButton: !isResident, // Solo administradores pueden crear visitas
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
            <VisitIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{config.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{config.subtitle}</p>
          </div>
        </div>
        {config.showCreateButton && (
          <button
            onClick={() => setShowCreateForm(true)}
            className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${config.buttonColor}`}
          >
            <PlusIcon />
            <span className="ml-2">{config.buttonText}</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar visitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FilterIcon />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="SCHEDULED">Programadas</option>
              <option value="ARRIVED">Llegadas</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <VisitIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Visitas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{allVisits.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <VisitIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Programadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {allVisits.filter((v) => v.status === 'SCHEDULED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <VisitIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Llegadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {allVisits.filter((v) => v.status === 'ARRIVED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <VisitIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {allVisits.filter((v) => v.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de visitas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{config.listTitle}</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredVisits.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <VisitIcon />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No hay visitas
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'No se encontraron visitas con los filtros aplicados.'
                  : config.emptyMessage}
              </p>
            </div>
          ) : (
            filteredVisits.map((visit) => (
              <div key={visit.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <VisitIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {visit.visitorName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getPurposeText(visit.visitPurpose)} • {visit.visitorId}
                        </p>
                        {/* Mostrar unidad y residente solo para administradores */}
                        {!isResident && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <svg
                              className="w-4 h-4"
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
                            <span>Unidad {visit.unitId}</span>
                            <span>•</span>
                            <span>{visit.residentName}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(visit.expectedArrival).toLocaleDateString()} de{' '}
                          {new Date(visit.expectedArrival).toLocaleTimeString()} a{' '}
                          {new Date(visit.expectedDeparture).toLocaleTimeString()}
                        </p>
                        {visit.vehicleInfo && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Vehículo: {visit.vehicleInfo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={visit.status} />
                    {/* Residentes y administradores pueden marcar llegadas y salidas */}
                    {visit.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleMarkAsArrived(visit.id)}
                        className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                      >
                        Marcar llegada
                      </button>
                    )}
                    {visit.status === 'ARRIVED' && (
                      <button
                        onClick={() => handleMarkAsCompleted(visit.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Marcar salida
                      </button>
                    )}
                    <button
                      onClick={() => handleEditVisit(visit)}
                      disabled={isLoadingDetails}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingDetails ? 'Cargando...' : 'Ver detalles'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modales */}
      {showCreateForm && (
        <VisitModal
          isOpen={showCreateForm}
          onClose={handleCloseModal}
          onSubmit={handleCreateVisit}
          units={units}
        />
      )}

      {editingVisit && (
        <VisitModal
          isOpen={!!editingVisit}
          onClose={handleCloseModal}
          onSubmit={handleCreateVisit}
          initialData={editingVisit}
          units={units}
          isEditing={!isResident}
          isReadOnly={isResident}
          userUnits={user?.userUnits || []}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
