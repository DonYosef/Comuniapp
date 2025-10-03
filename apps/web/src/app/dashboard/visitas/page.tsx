'use client';

import { useState } from 'react';

import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  VisitModal,
  StatusBadge,
  useVisits,
  Toast,
  VisitFormData,
} from '@/components/visitas/VisitComponents';
import { useCommunities } from '@/hooks/useCommunities';

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
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
    />
  </svg>
);

// Componente de Card de Métrica
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({ title, value, icon, color, subtitle, trend }: StatCardProps) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1">
      <div className="p-4 sm:p-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            className={`p-2 sm:p-3 bg-gradient-to-br ${colorClasses[color]} rounded-lg sm:rounded-xl shadow-lg`}
          >
            <div className="text-white">{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              {title}
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-1">
                <span
                  className={`text-xs font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tipo unificado para visitas
interface VisitItem {
  id: string;
  visitorName: string;
  visitorId: string;
  visitorPhone?: string;
  visitorEmail?: string;
  unitId: string;
  residentName: string;
  residentPhone?: string;
  visitPurpose: string;
  expectedArrival: string;
  expectedDeparture?: string;
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
    unitId: '101',
    residentName: 'Carlos López',
    residentPhone: '+52 55 9876 5432',
    visitPurpose: 'personal',
    expectedArrival: '2024-01-15T14:00:00',
    expectedDeparture: '2024-01-15T16:00:00',
    vehicleInfo: 'Toyota Corolla ABC-123',
    notes: 'Visita familiar',
    status: 'SCHEDULED' as const,
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '2',
    visitorName: 'Roberto Silva',
    visitorId: '87654321',
    visitorPhone: '+52 55 2345 6789',
    visitorEmail: 'roberto.silva@email.com',
    unitId: '205',
    residentName: 'Ana Martínez',
    residentPhone: '+52 55 8765 4321',
    visitPurpose: 'business',
    expectedArrival: '2024-01-14T10:00:00',
    expectedDeparture: '2024-01-14T12:00:00',
    vehicleInfo: 'Honda Civic XYZ-456',
    notes: 'Reunión de negocios',
    status: 'ARRIVED' as const,
    arrivalTime: new Date('2024-01-14T10:15:00'),
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '3',
    visitorName: 'Laura Fernández',
    visitorId: '11223344',
    visitorPhone: '+52 55 3456 7890',
    visitorEmail: 'laura.fernandez@email.com',
    unitId: '302',
    residentName: 'Pedro García',
    residentPhone: '+52 55 7654 3210',
    visitPurpose: 'delivery',
    expectedArrival: '2024-01-13T15:30:00',
    expectedDeparture: '2024-01-13T16:00:00',
    vehicleInfo: 'Moto Honda DEF-789',
    notes: 'Entrega de paquete',
    status: 'COMPLETED' as const,
    arrivalTime: new Date('2024-01-13T15:35:00'),
    departureTime: new Date('2024-01-13T15:55:00'),
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '4',
    visitorName: 'Juan Pérez',
    visitorId: '55667788',
    visitorPhone: '+52 55 4567 8901',
    visitorEmail: 'juan.perez@email.com',
    unitId: '108',
    residentName: 'Carmen Ruiz',
    residentPhone: '+52 55 6543 2109',
    visitPurpose: 'maintenance',
    expectedArrival: '2024-01-12T09:00:00',
    expectedDeparture: '2024-01-12T11:00:00',
    vehicleInfo: 'Van de servicio GHI-012',
    notes: 'Mantenimiento de aire acondicionado',
    status: 'CANCELLED' as const,
    communityName: 'Residencial Los Pinos',
  },
];

export default function VisitasPage() {
  const { isLoading: communitiesLoading, error: communitiesError } = useCommunities();
  const {
    visits,
    isLoading: visitsLoading,
    createVisit,
    markAsArrived,
    markAsCompleted,
  } = useVisits();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitFormData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Combinar datos mock con datos del hook
  const allVisits: VisitItem[] = [
    ...mockVisits,
    ...visits.map((v) => ({
      id: v.id || '',
      visitorName: v.visitorName,
      visitorId: v.visitorId,
      visitorPhone: v.visitorPhone,
      visitorEmail: v.visitorEmail,
      unitId: v.unitId,
      residentName: v.residentName,
      residentPhone: v.residentPhone,
      visitPurpose: v.visitPurpose,
      expectedArrival: v.expectedArrival,
      expectedDeparture: v.expectedDeparture,
      vehicleInfo: v.vehicleInfo,
      notes: v.notes,
      status: v.status || 'SCHEDULED',
      arrivalTime: v.arrivalTime,
      departureTime: v.departureTime,
      communityName: 'Residencial Los Pinos',
    })),
  ];

  // Filtrar visitas
  const filteredVisits = allVisits.filter((visit) => {
    const matchesSearch =
      visit.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.unitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.visitPurpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcular estadísticas
  const stats = {
    total: allVisits.length,
    scheduled: allVisits.filter((v) => v.status === 'SCHEDULED').length,
    arrived: allVisits.filter((v) => v.status === 'ARRIVED').length,
    completed: allVisits.filter((v) => v.status === 'COMPLETED').length,
    cancelled: allVisits.filter((v) => v.status === 'CANCELLED').length,
  };

  // Handlers
  const handleCreateVisit = async (data: VisitFormData) => {
    try {
      await createVisit(data);
      setShowCreateForm(false);
      setToast({ message: 'Visita registrada exitosamente', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al registrar la visita', type: 'error' });
    }
  };

  const handleMarkAsArrived = async (id: string) => {
    try {
      await markAsArrived(id);
      setToast({ message: 'Visita marcada como llegada', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al marcar como llegada', type: 'error' });
    }
  };

  const handleMarkAsCompleted = async (id: string) => {
    try {
      await markAsCompleted(id);
      setToast({ message: 'Visita marcada como completada', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al marcar como completada', type: 'error' });
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
      expectedDeparture: visit.expectedDeparture || '',
      vehicleInfo: visit.vehicleInfo || '',
      notes: visit.notes || '',
    });
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const getPurposeText = (purpose: string) => {
    const purposes = {
      personal: 'Visita personal',
      business: 'Negocios',
      delivery: 'Entrega',
      maintenance: 'Mantenimiento',
      emergency: 'Emergencia',
      other: 'Otro',
    };
    return purposes[purpose as keyof typeof purposes] || purpose;
  };

  if (communitiesLoading) {
    return (
      <ProtectedRoute>
        <RoleGuard requireAdmin={true}>
          <DashboardLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <LoadingSpinner size="lg" text="Cargando visitas..." />
            </div>
          </DashboardLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  if (communitiesError) {
    return (
      <ProtectedRoute>
        <RoleGuard requireAdmin={true}>
          <DashboardLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <ErrorMessage
                message={String(communitiesError || 'Error al cargar las comunidades')}
              />
            </div>
          </DashboardLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <RoleGuard requireAdmin={true}>
        <DashboardLayout>
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header moderno */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-100 dark:border-gray-700 animate-slide-down">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                    <VisitIcon />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Visitas
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                      Control de acceso y registro de visitantes
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="group relative inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <PlusIcon />
                    <span className="hidden sm:inline ml-2">+ Nueva Visita</span>
                    <span className="sm:hidden ml-2">+ Nueva</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div
              className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              <StatCard
                title="Total Visitas"
                value={stats.total}
                icon={<VisitIcon />}
                color="blue"
                subtitle="Este mes"
              />
              <StatCard
                title="Programadas"
                value={stats.scheduled}
                icon={<ClockIcon />}
                color="yellow"
                subtitle="Pendientes"
              />
              <StatCard
                title="Llegaron"
                value={stats.arrived}
                icon={<UserIcon />}
                color="orange"
                subtitle="En curso"
              />
              <StatCard
                title="Completadas"
                value={stats.completed}
                icon={<CheckIcon />}
                color="green"
                subtitle="Finalizadas"
              />
              <StatCard
                title="Canceladas"
                value={stats.cancelled}
                icon={<ClockIcon />}
                color="red"
                subtitle="No realizadas"
              />
            </div>

            {/* Filtros y búsqueda */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
                    <SearchIcon />
                  </div>
                  Filtros y Búsqueda
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Busca y filtra las visitas por estado
                </p>
              </div>

              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Búsqueda */}
                  <div className="flex-1">
                    <label
                      htmlFor="search"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Buscar visitas
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                      </div>
                      <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Buscar por visitante, residente, unidad o propósito..."
                      />
                    </div>
                  </div>

                  {/* Filtro de estado */}
                  <div className="sm:w-48">
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Estado
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FilterIcon />
                      </div>
                      <select
                        id="status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="all">Todos los estados</option>
                        <option value="SCHEDULED">Programadas</option>
                        <option value="ARRIVED">Llegaron</option>
                        <option value="COMPLETED">Completadas</option>
                        <option value="CANCELLED">Canceladas</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de visitas */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                    <VisitIcon />
                  </div>
                  Lista de Visitas
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {filteredVisits.length} visita{filteredVisits.length !== 1 ? 's' : ''} encontrada
                  {filteredVisits.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="p-6">
                {filteredVisits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <VisitIcon />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No hay visitas
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No se encontraron visitas con los filtros aplicados'
                        : 'No hay visitas registradas aún'}
                    </p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      <PlusIcon />
                      <span className="ml-2">Registrar Primera Visita</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {visit.visitorName}
                              </h3>
                              <StatusBadge status={visit.status || 'SCHEDULED'} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                              <div className="flex items-center space-x-2">
                                <UserIcon />
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Visitante</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {visit.visitorName}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    ID: {visit.visitorId}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <HomeIcon />
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Unidad</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {visit.unitId}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {visit.residentName}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <CalendarIcon />
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Llegada</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {formatDate(visit.expectedArrival)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Información adicional */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="p-1 bg-purple-100 dark:bg-purple-900 rounded">
                                  <svg
                                    className="w-4 h-4 text-purple-600 dark:text-purple-400"
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
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Propósito</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {getPurposeText(visit.visitPurpose)}
                                  </p>
                                </div>
                              </div>

                              {visit.vehicleInfo && (
                                <div className="flex items-center space-x-2">
                                  <div className="p-1 bg-gray-100 dark:bg-gray-600 rounded">
                                    <svg
                                      className="w-4 h-4 text-gray-600 dark:text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3z"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 dark:text-gray-400">Vehículo</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {visit.vehicleInfo}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Tiempos de llegada y salida si aplican */}
                            {(visit.arrivalTime || visit.departureTime) && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  {visit.arrivalTime && (
                                    <div className="flex items-center space-x-2">
                                      <CheckIcon />
                                      <div>
                                        <p className="text-gray-500 dark:text-gray-400">Llegó el</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {formatDate(visit.arrivalTime)}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {visit.departureTime && (
                                    <div className="flex items-center space-x-2">
                                      <CheckIcon />
                                      <div>
                                        <p className="text-gray-500 dark:text-gray-400">Salió el</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {formatDate(visit.departureTime)}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            {visit.status === 'SCHEDULED' && (
                              <button
                                onClick={() => handleMarkAsArrived(visit.id || '')}
                                className="inline-flex items-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                <UserIcon />
                                <span className="ml-2">Marcar como Llegado</span>
                              </button>
                            )}
                            {visit.status === 'ARRIVED' && (
                              <button
                                onClick={() => handleMarkAsCompleted(visit.id || '')}
                                className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                <CheckIcon />
                                <span className="ml-2">Marcar como Completada</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleEditVisit(visit)}
                              className="inline-flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                            >
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
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                              <span className="ml-2">Editar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modales y Toast */}
            <VisitModal
              isOpen={showCreateForm}
              onClose={() => setShowCreateForm(false)}
              onSubmit={handleCreateVisit}
              isLoading={visitsLoading}
            />

            <VisitModal
              isOpen={!!editingVisit}
              onClose={() => setEditingVisit(null)}
              onSubmit={handleCreateVisit}
              initialData={editingVisit || undefined}
              isEditing={true}
              isLoading={visitsLoading}
            />

            {toast && (
              <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
          </div>
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
