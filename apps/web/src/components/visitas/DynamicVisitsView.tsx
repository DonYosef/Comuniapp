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

// Datos mock para visitas
const mockVisits: VisitItem[] = [
  {
    id: '1',
    visitorName: 'María González',
    visitorId: '12345678',
    visitorPhone: '+52 55 1234 5678',
    visitorEmail: 'maria.gonzalez@email.com',
    unitId: '201',
    residentName: 'Juan Pérez',
    residentPhone: '+52 55 9876 5432',
    visitPurpose: 'personal',
    expectedArrival: '2024-01-15T10:00:00',
    expectedDeparture: '2024-01-15T12:00:00',
    vehicleInfo: 'Honda Civic ABC-123',
    notes: 'Visita familiar',
    status: 'SCHEDULED',
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '2',
    visitorName: 'Carlos López',
    visitorId: '87654321',
    visitorPhone: '+52 55 8765 4321',
    visitorEmail: 'carlos.lopez@email.com',
    unitId: '201',
    residentName: 'Juan Pérez',
    residentPhone: '+52 55 9876 5432',
    visitPurpose: 'maintenance',
    expectedArrival: '2024-01-14T09:00:00',
    expectedDeparture: '2024-01-14T11:00:00',
    vehicleInfo: 'Van de servicio XYZ-789',
    notes: 'Mantenimiento de aire acondicionado',
    status: 'ARRIVED',
    arrivalTime: new Date('2024-01-14T09:15:00'),
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '3',
    visitorName: 'Ana Martínez',
    visitorId: '11223344',
    visitorPhone: '+52 55 1122 3344',
    visitorEmail: 'ana.martinez@email.com',
    unitId: '108',
    residentName: 'Laura Fernández',
    residentPhone: '+52 55 6543 2109',
    visitPurpose: 'delivery',
    expectedArrival: '2024-01-13T14:00:00',
    expectedDeparture: '2024-01-13T14:30:00',
    vehicleInfo: 'Moto de reparto',
    notes: 'Entrega de paquete',
    status: 'COMPLETED',
    arrivalTime: new Date('2024-01-13T14:05:00'),
    departureTime: new Date('2024-01-13T14:25:00'),
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '4',
    visitorName: 'Roberto Silva',
    visitorId: '55667788',
    visitorPhone: '+52 55 5566 7788',
    visitorEmail: 'roberto.silva@email.com',
    unitId: '108',
    residentName: 'Laura Fernández',
    residentPhone: '+52 55 6543 2109',
    visitPurpose: 'business',
    expectedArrival: '2024-01-12T16:00:00',
    expectedDeparture: '2024-01-12T18:00:00',
    vehicleInfo: 'BMW X5 DEF-456',
    notes: 'Reunión de trabajo',
    status: 'CANCELLED',
    communityName: 'Residencial Los Pinos',
  },
];

interface DynamicVisitsViewProps {
  isResidentView?: boolean;
}

export default function DynamicVisitsView({ isResidentView = false }: DynamicVisitsViewProps) {
  const { user, isAdmin } = useAuth();
  const { isLoading: communitiesLoading, error: communitiesError, communities } = useCommunities();
  const { createVisit, markAsArrived, markAsCompleted } = useVisits();
  const [visits, setVisits] = useState<VisitorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitFormData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Determinar si es vista de residente basado en el rol o prop
  const isResident = isResidentView || user?.roles?.some((role) => role.name === 'RESIDENT');

  // Obtener la comunidad del usuario
  const userCommunity = communities?.[0]; // Asumiendo que el usuario pertenece a una comunidad
  const { units, isLoading: unitsLoading } = useUnits(userCommunity?.id);

  // Cargar visitas desde la API
  useEffect(() => {
    const fetchVisits = async () => {
      if (!userCommunity) return;

      setIsLoading(true);
      try {
        const visitsData = await VisitorsService.getVisitors();
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
  }, [userCommunity]);

  // Combinar datos mock con datos reales de la API
  // Solo incluir datos mock si NO es admin (para evitar mostrar datos de prueba a administradores)
  let allVisits: VisitItem[] = [
    // Solo incluir datos mock si no es admin
    ...(isAdmin() ? [] : mockVisits),
    ...visits.map((v) => ({
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
    })),
  ];

  // Si es vista de residente, filtrar solo las visitas de su unidad
  if (isResident && user?.unitId) {
    allVisits = allVisits.filter((visit) => visit.unitId === user.unitId);
  }

  // Filtrar visitas
  const filteredVisits = allVisits.filter((visit) => {
    const matchesSearch =
      visit.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitorId.includes(searchTerm) ||
      visit.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateVisit = async (data: VisitFormData) => {
    try {
      await createVisit(data);
      setShowCreateForm(false);
      setToast({
        message: 'Visita registrada exitosamente',
        type: 'success',
      });

      // Recargar las visitas
      const visitsData = await VisitorsService.getVisitors();
      setVisits(visitsData);
    } catch (error) {
      setToast({
        message: 'Error al registrar la visita',
        type: 'error',
      });
    }
  };

  const handleEditVisit = (visit: VisitItem) => {
    setEditingVisit({
      id: visit.id,
      visitorName: visit.visitorName,
      visitorId: visit.visitorId,
      visitorPhone: visit.visitorPhone || '',
      visitorEmail: visit.visitorEmail || '',
      unitId: visit.unitId,
      residentName: visit.residentName,
      residentPhone: visit.residentPhone || '',
      visitPurpose: visit.visitPurpose,
      expectedArrival: visit.expectedArrival,
      expectedDeparture: visit.expectedDeparture,
      vehicleInfo: visit.vehicleInfo || '',
      notes: visit.notes || '',
    });
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
                    {/* Solo administradores pueden marcar llegadas y salidas */}
                    {!isResident && visit.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleMarkAsArrived(visit.id)}
                        className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                      >
                        Marcar llegada
                      </button>
                    )}
                    {!isResident && visit.status === 'ARRIVED' && (
                      <button
                        onClick={() => handleMarkAsCompleted(visit.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Marcar salida
                      </button>
                    )}
                    <button
                      onClick={() => handleEditVisit(visit)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Ver detalles
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
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
