'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  ParcelModal,
  StatusBadge,
  useParcels,
  Toast,
  ParcelFormData,
} from '@/components/encomiendas/ParcelComponents';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCommunities } from '@/hooks/useCommunities';
import { useUnits } from '@/hooks/useUnits';
import { ParcelsService, ParcelResponse } from '@/services/parcels.service';

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

interface ParcelItem {
  unitId: string;
  id: string;
  unitNumber: string;
  description: string;
  sender: string;
  senderPhone?: string;
  recipientName: string;
  recipientResidence: string;
  recipientPhone?: string;
  recipientEmail?: string;
  conciergeName?: string;
  conciergePhone?: string;
  notes?: string;
  receivedAt: Date;
  retrievedAt?: Date | null;
  status: 'RECEIVED' | 'RETRIEVED' | 'EXPIRED';
  communityName: string;
}

// Datos mock para encomiendas - ELIMINADOS
// Los datos de prueba han sido removidos para mostrar solo datos reales de la API

interface DynamicParcelsViewProps {
  isResidentView?: boolean;
}

export default function DynamicParcelsView({ isResidentView = false }: DynamicParcelsViewProps) {
  const { user, isAdmin } = useAuth();

  // Determinar si es vista de residente basado en el rol o prop
  const isResident = isResidentView || user?.roles?.some((role) => role.name === 'RESIDENT');

  // Solo cargar comunidades si NO es residente
  const { isLoading: communitiesLoading, error: communitiesError, communities } = useCommunities();

  const { createParcel, updateParcel, markAsRetrieved } = useParcels();
  const [parcels, setParcels] = useState<ParcelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingParcel, setEditingParcel] = useState<ParcelFormData | null>(null);
  const [editingUnits, setEditingUnits] = useState<ReturnType<typeof useUnits>['units']>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Determinar comunidad según rol (admin usa comunidades cargadas; conserje usa comunidades del token)
  const isConcierge = user?.roles?.some((role) => role.name === 'CONCIERGE');
  const adminCommunityId = !isResident ? communities?.[0]?.id : undefined;
  const conciergeCommunityId = isConcierge ? user?.communities?.[0]?.id : undefined;
  const selectedCommunityId = adminCommunityId || conciergeCommunityId;
  const { units, isLoading: unitsLoading } = useUnits(selectedCommunityId);

  // Cargar encomiendas desde la API
  useEffect(() => {
    const fetchParcels = async () => {
      // Para residentes o conserjes no exigimos comunidad; para administradores sí
      if (!isResident && !isConcierge && !selectedCommunityId) return;

      setIsLoading(true);
      try {
        // Si es residente y tiene unidades, obtener solo las encomiendas de sus unidades
        let parcelsData;
        if (isResident && user?.userUnits && user.userUnits.length > 0) {
          // Para residentes, obtener encomiendas de todas sus unidades
          const userUnitIds = user.userUnits.map((userUnit) => userUnit.unit?.id).filter(Boolean);
          console.log('🔍 Resident user units:', userUnitIds);
          parcelsData = [];

          // Obtener encomiendas para cada unidad del usuario
          for (const unitId of userUnitIds) {
            console.log('📦 Fetching parcels for unit:', unitId);
            const unitParcels = await ParcelsService.getParcels(unitId);
            console.log('📦 Parcels found for unit:', unitId, unitParcels.length);
            parcelsData.push(...unitParcels);
          }
        } else {
          // Para admins, obtener todas las encomiendas
          console.log('👑 Admin user - fetching all parcels');
          parcelsData = await ParcelsService.getParcels();
        }

        console.log('📦 Total parcels loaded:', parcelsData.length);
        setParcels(parcelsData);
      } catch (error) {
        console.error('Error fetching parcels:', error);
        setToast({
          message: 'Error al cargar las encomiendas',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParcels();
  }, [selectedCommunityId, user, isResident]);

  // Convertir datos reales de la API a formato de visualización
  let allParcels: ParcelItem[] = parcels.map((p) => ({
    unitId: p.unitId,
    id: p.id,
    unitNumber: p.unitNumber,
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
    receivedAt: new Date(p.receivedAt),
    retrievedAt: p.retrievedAt ? new Date(p.retrievedAt) : null,
    status: p.status,
    communityName: p.communityName,
  }));

  // Nota: Ya no necesitamos filtrar por unidad aquí porque la API ya devuelve solo las encomiendas relevantes
  // para cada tipo de usuario (residente vs admin)

  // Filtrar encomiendas
  const filteredParcels = allParcels.filter((parcel) => {
    const matchesSearch =
      parcel.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || parcel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateParcel = async (data: ParcelFormData) => {
    try {
      await createParcel(data);
      setShowCreateForm(false);
      setToast({
        message: 'Encomienda registrada exitosamente',
        type: 'success',
      });

      // Recargar las encomiendas
      const parcelsData = await ParcelsService.getParcels();
      setParcels(parcelsData);
    } catch (error) {
      setToast({
        message: 'Error al registrar la encomienda',
        type: 'error',
      });
    }
  };

  const handleEditParcel = async (parcel: ParcelItem) => {
    try {
      setIsLoadingDetails(true);
      const details = await ParcelsService.getParcel(parcel.id);
      setEditingParcel({
        id: details.id,
        unitId: details.unitId,
        description: details.description,
        sender: details.sender || '',
        senderPhone: (details as any).senderPhone || '',
        recipientName: (details as any).recipientName || '',
        recipientResidence: (details as any).recipientResidence || '',
        recipientPhone: (details as any).recipientPhone || '',
        recipientEmail: (details as any).recipientEmail || '',
        conciergeName: (details as any).conciergeName || '',
        conciergePhone: (details as any).conciergePhone || '',
        notes: (details as any).notes || '',
        receivedAt: new Date(details.receivedAt),
        status: details.status,
      });

      // Preparar unidades para el modal: si no hay unidades cargadas por contexto, usar la unidad del detalle
      if (!units || units.length === 0) {
        setEditingUnits([
          {
            id: details.unitId,
            number: details.unitNumber,
            floor: undefined,
            type: 'APARTMENT',
            communityName: details.communityName,
            residents: (details.residents || []).map((r) => ({
              id: r.id,
              name: r.name,
              email: r.email,
              phone: r.phone,
              status: r.status,
            })),
          },
        ] as any);
      } else {
        setEditingUnits(units);
      }
    } catch (error) {
      setToast({ message: 'Error al cargar los detalles de la encomienda', type: 'error' });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUpdateParcel = async (data: ParcelFormData) => {
    try {
      if (!data.id) throw new Error('ID de encomienda no proporcionado');
      await updateParcel(data.id, data);
      setEditingParcel(null);
      setToast({ message: 'Encomienda actualizada exitosamente', type: 'success' });

      const parcelsData = await ParcelsService.getParcels();
      setParcels(parcelsData);
    } catch (error) {
      setToast({ message: 'Error al actualizar la encomienda', type: 'error' });
    }
  };

  const handleMarkAsRetrieved = async (id: string) => {
    try {
      await markAsRetrieved(id);
      setToast({
        message: isResident
          ? 'Encomienda marcada como recibida'
          : 'Encomienda marcada como retirada',
        type: 'success',
      });

      // Recargar las encomiendas
      const parcelsData = await ParcelsService.getParcels();
      setParcels(parcelsData);
    } catch (error) {
      setToast({
        message: isResident ? 'Error al marcar como recibida' : 'Error al marcar como retirada',
        type: 'error',
      });
    }
  };

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setEditingParcel(null);
  };

  // Para residentes, solo mostrar loading si está cargando encomiendas
  // Para admins, mostrar loading si está cargando comunidades, encomiendas o unidades
  const shouldShowLoading = isLoading || (!isResident && (communitiesLoading || unitsLoading));

  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Para residentes, no mostrar error de comunidades
  // Para admins, mostrar error de comunidades si existe
  if (!isResident && communitiesError) {
    return <ErrorMessage message="Error al cargar las comunidades" />;
  }

  // Configuración dinámica basada en el tipo de vista
  const config = {
    title: isResident ? 'Tus Encomiendas' : 'Encomiendas',
    subtitle: isResident
      ? 'Gestiona las encomiendas de tu unidad'
      : 'Gestiona todas las encomiendas',
    buttonText: 'Registrar Encomienda',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    listTitle: isResident ? 'Encomiendas de tu Unidad' : 'Todas las Encomiendas',
    emptyMessage: isResident
      ? 'No tienes encomiendas registradas.'
      : 'No hay encomiendas registradas.',
    showCreateButton: !isResident, // Solo administradores pueden crear encomiendas
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
            <PackageIcon />
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
              placeholder="Buscar encomiendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FilterIcon />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="RECEIVED">Recibidas</option>
              <option value="RETRIEVED">Retiradas</option>
              <option value="EXPIRED">Vencidas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <PackageIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Encomiendas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {allParcels.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <PackageIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {allParcels.filter((p) => p.status === 'RECEIVED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <PackageIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Retiradas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {allParcels.filter((p) => p.status === 'RETRIEVED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de encomiendas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{config.listTitle}</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredParcels.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <PackageIcon />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No hay encomiendas
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'No se encontraron encomiendas con los filtros aplicados.'
                  : config.emptyMessage}
              </p>
            </div>
          ) : (
            filteredParcels.map((parcel) => (
              <div key={parcel.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <PackageIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {parcel.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          De: {parcel.sender}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Para: {parcel.recipientName} - Unidad {parcel.unitNumber}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Recibido: {parcel.receivedAt.toLocaleDateString()} a las{' '}
                          {parcel.receivedAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={parcel.status} />
                    {parcel.status === 'RECEIVED' && (
                      <button
                        onClick={() => handleMarkAsRetrieved(parcel.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        {isResident ? 'Marcar como recibido' : 'Marcar como retirada'}
                      </button>
                    )}
                    <button
                      onClick={() => handleEditParcel(parcel)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {isResident ? 'Ver detalles' : 'Editar'}
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
        <ParcelModal
          isOpen={showCreateForm}
          onClose={handleCloseModal}
          onSubmit={handleCreateParcel}
          units={units}
        />
      )}

      {editingParcel && (
        <ParcelModal
          isOpen={!!editingParcel}
          onClose={handleCloseModal}
          onSubmit={!isResident ? handleUpdateParcel : handleCreateParcel}
          initialData={editingParcel}
          isEditing={!isResident}
          isReadOnly={isResident}
          userUnits={user?.userUnits || []}
          units={editingUnits && editingUnits.length > 0 ? editingUnits : units}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
