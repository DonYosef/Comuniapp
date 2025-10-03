'use client';

import { useState } from 'react';

import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import {
  ParcelModal,
  StatusBadge,
  useParcels,
  Toast,
  ParcelFormData,
} from '@/components/encomiendas/ParcelComponents';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCommunities } from '@/hooks/useCommunities';

// Iconos SVG
const PackageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
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

// Tipo unificado para encomiendas
interface ParcelItem {
  id: string;
  unitNumber: string;
  description: string;
  sender: string;
  senderPhone?: string;
  // Datos del destinatario
  recipientName: string;
  recipientResidence: string;
  recipientPhone?: string;
  recipientEmail?: string;
  // Datos del conserje
  conciergeName: string;
  conciergePhone?: string;
  notes?: string;
  receivedAt: Date;
  retrievedAt: Date | null;
  status: 'RECEIVED' | 'RETRIEVED' | 'EXPIRED';
  communityName: string;
}

// Datos mock para encomiendas
const mockParcels: ParcelItem[] = [
  {
    id: '1',
    unitNumber: '101',
    description: 'Paquete de Amazon',
    sender: 'Amazon México',
    senderPhone: '+52 55 1234 5678',
    recipientName: 'Juan Pérez',
    recipientResidence: '101',
    recipientPhone: '+52 55 9876 5432',
    recipientEmail: 'juan.perez@email.com',
    conciergeName: 'Carlos López',
    conciergePhone: '+52 55 1111 2222',
    receivedAt: new Date('2024-01-15T10:30:00'),
    retrievedAt: null,
    status: 'RECEIVED' as const,
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '2',
    unitNumber: '205',
    description: 'Documentos importantes',
    sender: 'Banco Nacional',
    senderPhone: '+52 55 2345 6789',
    recipientName: 'María García',
    recipientResidence: '205',
    recipientPhone: '+52 55 8765 4321',
    recipientEmail: 'maria.garcia@email.com',
    conciergeName: 'Ana Martínez',
    conciergePhone: '+52 55 2222 3333',
    receivedAt: new Date('2024-01-14T14:20:00'),
    retrievedAt: new Date('2024-01-15T09:15:00'),
    status: 'RETRIEVED' as const,
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '3',
    unitNumber: '302',
    description: 'Envío de MercadoLibre',
    sender: 'MercadoLibre',
    senderPhone: '+52 55 3456 7890',
    recipientName: 'Roberto Silva',
    recipientResidence: '302',
    recipientPhone: '+52 55 7654 3210',
    recipientEmail: 'roberto.silva@email.com',
    conciergeName: 'Carlos López',
    conciergePhone: '+52 55 1111 2222',
    receivedAt: new Date('2024-01-13T16:45:00'),
    retrievedAt: null,
    status: 'EXPIRED' as const,
    communityName: 'Residencial Los Pinos',
  },
  {
    id: '4',
    unitNumber: '108',
    description: 'Regalo de cumpleaños',
    sender: 'Familia García',
    senderPhone: '+52 55 4567 8901',
    recipientName: 'Laura Fernández',
    recipientResidence: '108',
    recipientPhone: '+52 55 6543 2109',
    recipientEmail: 'laura.fernandez@email.com',
    conciergeName: 'Ana Martínez',
    conciergePhone: '+52 55 2222 3333',
    receivedAt: new Date('2024-01-12T11:00:00'),
    retrievedAt: new Date('2024-01-12T18:30:00'),
    status: 'RETRIEVED' as const,
    communityName: 'Residencial Los Pinos',
  },
];

export default function EncomiendasPage() {
  const { isLoading: communitiesLoading, error: communitiesError } = useCommunities();
  const { parcels, isLoading: parcelsLoading, createParcel, markAsRetrieved } = useParcels();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingParcel, setEditingParcel] = useState<ParcelFormData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Combinar datos mock con datos del hook
  const allParcels: ParcelItem[] = [
    ...mockParcels,
    ...parcels.map((p) => ({
      id: p.id || '',
      unitNumber: p.unitId,
      description: p.description,
      sender: p.sender,
      senderPhone: p.senderPhone,
      recipientName: p.recipientName || 'No especificado',
      recipientResidence: p.recipientResidence || 'No especificado',
      recipientPhone: p.recipientPhone,
      recipientEmail: p.recipientEmail,
      conciergeName: p.conciergeName || 'No especificado',
      conciergePhone: p.conciergePhone,
      notes: p.notes,
      receivedAt: p.receivedAt || new Date(),
      retrievedAt: p.retrievedAt || null,
      status: p.status || 'RECEIVED',
      communityName: 'Residencial Los Pinos',
    })),
  ];

  // Filtrar encomiendas
  const filteredParcels = allParcels.filter((parcel) => {
    const matchesSearch =
      parcel.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientResidence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.conciergeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.unitNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || parcel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcular estadísticas
  const stats = {
    total: allParcels.length,
    received: allParcels.filter((p) => p.status === 'RECEIVED').length,
    retrieved: allParcels.filter((p) => p.status === 'RETRIEVED').length,
    expired: allParcels.filter((p) => p.status === 'EXPIRED').length,
  };

  // Handlers
  const handleCreateParcel = async (data: ParcelFormData) => {
    try {
      await createParcel(data);
      setShowCreateForm(false);
      setToast({ message: 'Encomienda registrada exitosamente', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al registrar la encomienda', type: 'error' });
    }
  };

  const handleMarkAsRetrieved = async (id: string) => {
    try {
      await markAsRetrieved(id);
      setToast({ message: 'Encomienda marcada como entregada', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al marcar como entregada', type: 'error' });
    }
  };

  const handleEditParcel = (parcel: ParcelItem) => {
    setEditingParcel({
      id: parcel.id,
      unitId: parcel.unitNumber,
      description: parcel.description,
      sender: parcel.sender,
      senderPhone: parcel.senderPhone || '',
      recipientName: parcel.recipientName,
      recipientResidence: parcel.recipientResidence,
      recipientPhone: parcel.recipientPhone || '',
      recipientEmail: parcel.recipientEmail || '',
      conciergeName: parcel.conciergeName,
      conciergePhone: parcel.conciergePhone || '',
      notes: parcel.notes || '',
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (communitiesLoading) {
    return (
      <ProtectedRoute>
        <RoleGuard requiredPermission="manage_parcels">
          <DashboardLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <LoadingSpinner size="lg" text="Cargando encomiendas..." />
            </div>
          </DashboardLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  if (communitiesError) {
    return (
      <ProtectedRoute>
        <RoleGuard requiredPermission="manage_parcels">
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
      <RoleGuard requiredPermission="manage_parcels">
        <DashboardLayout>
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header moderno */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 border border-orange-100 dark:border-gray-700 animate-slide-down">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900 rounded-xl">
                    <PackageIcon />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Encomiendas
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                      Gestión de paquetes y encomiendas
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="group relative inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <PlusIcon />
                    <span className="hidden sm:inline ml-2">+ Nueva Encomienda</span>
                    <span className="sm:hidden ml-2">+ Nueva</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              <StatCard
                title="Total Encomiendas"
                value={stats.total}
                icon={<PackageIcon />}
                color="orange"
                subtitle="Este mes"
              />
              <StatCard
                title="Recibidas"
                value={stats.received}
                icon={<ClockIcon />}
                color="blue"
                subtitle="Pendientes de entrega"
              />
              <StatCard
                title="Entregadas"
                value={stats.retrieved}
                icon={<CheckIcon />}
                color="green"
                subtitle="Completadas"
              />
              <StatCard
                title="Vencidas"
                value={stats.expired}
                icon={<ClockIcon />}
                color="red"
                subtitle="Requieren atención"
              />
            </div>

            {/* Filtros y búsqueda */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-700 dark:to-orange-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
                    <SearchIcon />
                  </div>
                  Filtros y Búsqueda
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Busca y filtra las encomiendas por estado
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
                      Buscar encomiendas
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
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Buscar por descripción, remitente, destinatario, residencia, conserje o unidad..."
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
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="all">Todos los estados</option>
                        <option value="RECEIVED">Recibidas</option>
                        <option value="RETRIEVED">Entregadas</option>
                        <option value="EXPIRED">Vencidas</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de encomiendas */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mr-3">
                    <PackageIcon />
                  </div>
                  Lista de Encomiendas
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {filteredParcels.length} encomienda{filteredParcels.length !== 1 ? 's' : ''}{' '}
                  encontrada{filteredParcels.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="p-6">
                {filteredParcels.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <PackageIcon />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No hay encomiendas
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No se encontraron encomiendas con los filtros aplicados'
                        : 'No hay encomiendas registradas aún'}
                    </p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      <PlusIcon />
                      <span className="ml-2">Registrar Primera Encomienda</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredParcels.map((parcel) => (
                      <div
                        key={parcel.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {parcel.description}
                              </h3>
                              <StatusBadge status={parcel.status || 'RECEIVED'} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                              <div className="flex items-center space-x-2">
                                <UserIcon />
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Remitente</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {parcel.sender}
                                  </p>
                                  {parcel.senderPhone && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {parcel.senderPhone}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
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
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Unidad</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {parcel.unitNumber}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <CalendarIcon />
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Recibido</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {formatDate(parcel.receivedAt || new Date())}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Información del destinatario y conserje */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
                                  <svg
                                    className="w-4 h-4 text-green-600 dark:text-green-400"
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
                                </div>
                                <div>
                                  <p className="text-gray-500 dark:text-gray-400">Destinatario</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {parcel.recipientName}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Residencia: {parcel.recipientResidence}
                                  </p>
                                  {parcel.recipientPhone && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {parcel.recipientPhone}
                                    </p>
                                  )}
                                </div>
                              </div>

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
                                  <p className="text-gray-500 dark:text-gray-400">Conserje</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {parcel.conciergeName}
                                  </p>
                                  {parcel.conciergePhone && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {parcel.conciergePhone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Fecha de entrega si aplica */}
                            {parcel.retrievedAt && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex items-center space-x-2 text-sm">
                                  <CheckIcon />
                                  <div>
                                    <p className="text-gray-500 dark:text-gray-400">Entregado el</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {formatDate(parcel.retrievedAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            {parcel.status === 'RECEIVED' && (
                              <button
                                onClick={() => handleMarkAsRetrieved(parcel.id || '')}
                                className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                              >
                                <CheckIcon />
                                <span className="ml-2">Marcar como Entregado</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleEditParcel(parcel)}
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
            <ParcelModal
              isOpen={showCreateForm}
              onClose={() => setShowCreateForm(false)}
              onSubmit={handleCreateParcel}
              isLoading={parcelsLoading}
            />

            <ParcelModal
              isOpen={!!editingParcel}
              onClose={() => setEditingParcel(null)}
              onSubmit={handleCreateParcel}
              initialData={editingParcel || undefined}
              isEditing={true}
              isLoading={parcelsLoading}
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
