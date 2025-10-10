'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUsersPaginated,
} from '@/hooks/useUsers';
import { UserResponseDto } from '@/types/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import UserModal from '@/components/residents/UserModal';
import ExportButton from '@/components/residents/ExportButton';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import Pagination from '@/components/ui/Pagination';
import UsersTableSkeleton from '@/components/ui/SkeletonLoader';
import CommunitiesDisplay from '@/components/ui/CommunitiesDisplay';
import { CommunityService } from '@/services/communityService';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Adaptar el tipo del frontend al del backend
interface ResidentFilters {
  search: string;
  status: 'all' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: 'all' | 'ADMIN' | 'RESIDENT' | 'CONCIERGE';
  building: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Community {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface UserUnit {
  id: string;
  unit: {
    id: string;
    number: string;
    community: {
      id: string;
      name: string;
      address: string;
    };
  };
}

interface CommunityAdmin {
  id: string;
  community: {
    id: string;
    name: string;
    address: string;
  };
}

export default function ResidentsPage() {
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Estado para filtros
  const [filters, setFilters] = useState<ResidentFilters>({
    search: '',
    status: 'all',
    role: 'all',
    building: 'all',
  });

  // Hooks para manejo de datos
  const { data: users, isLoading, error, refetch } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Hook para paginación
  const paginatedUsersQuery = useUsersPaginated({
    page: currentPage,
    limit: pageSize,
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    role: filters.role !== 'all' ? filters.role : undefined,
  });
  const [selectedResident, setSelectedResident] = useState<UserResponseDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<UserResponseDto | null>(null);
  const [communitiesByOrganization, setCommunitiesByOrganization] = useState<
    Record<string, Community[]>
  >({});

  // Usar datos paginados si están disponibles, sino usar datos completos
  const residents = useMemo(() => {
    if (
      paginatedUsersQuery.data &&
      typeof paginatedUsersQuery.data === 'object' &&
      'users' in paginatedUsersQuery.data
    ) {
      return Array.isArray(paginatedUsersQuery.data.users) ? paginatedUsersQuery.data.users : [];
    }
    if (!users) return [];
    return Array.isArray(users) ? users : [];
  }, [paginatedUsersQuery.data, users]);

  // Datos de paginación
  const paginationData: PaginationData =
    paginatedUsersQuery.data &&
    typeof paginatedUsersQuery.data === 'object' &&
    'total' in paginatedUsersQuery.data
      ? (paginatedUsersQuery.data as PaginationData)
      : {
          total: Array.isArray(users) ? users.length : 0,
          page: 1,
          limit: pageSize,
          totalPages: 1,
        };

  // Cargar comunidades por organización cuando cambien los residentes
  useEffect(() => {
    const loadCommunitiesByOrganization = async () => {
      const organizationIds = new Set<string>();

      // Recopilar todas las organizationIds únicas de los residentes
      residents.forEach((resident: UserResponseDto) => {
        if (resident.organizationId) {
          organizationIds.add(resident.organizationId);
        }
      });

      // Cargar comunidades para cada organización
      const communitiesPromises = Array.from(organizationIds).map(async (orgId) => {
        try {
          const communities = await CommunityService.getCommunitiesByOrganization(orgId);
          return { orgId, communities };
        } catch (error) {
          console.error(`Error cargando comunidades para organización ${orgId}:`, error);
          return { orgId, communities: [] };
        }
      });

      const results = await Promise.all(communitiesPromises);
      const communitiesMap: Record<string, Community[]> = {};

      results.forEach(({ orgId, communities }) => {
        communitiesMap[orgId] = communities;
      });

      setCommunitiesByOrganization(communitiesMap);
    };

    if (residents.length > 0) {
      loadCommunitiesByOrganization();
    }
  }, [residents]);

  // Función auxiliar para obtener la comunidad del usuario
  const getUserCommunity = (resident: UserResponseDto) => {
    // Si tiene unidades asignadas, obtener la comunidad de la primera unidad
    if (resident.userUnits && resident.userUnits.length > 0) {
      return resident.userUnits[0].unit.community;
    }

    // Si es administrador de comunidad, obtener la primera comunidad
    if (resident.communityAdmins && resident.communityAdmins.length > 0) {
      return resident.communityAdmins[0].community;
    }

    // Si tiene organización, buscar comunidades de esa organización
    if (resident.organizationId) {
      const communities = communitiesByOrganization[resident.organizationId];
      if (communities && communities.length > 0) {
        // Retornar la primera comunidad de la organización
        return communities[0];
      }
    }

    return null;
  };

  // Función auxiliar para obtener el nombre de la residencia registrada
  const getRegisteredCommunityName = (resident: UserResponseDto) => {
    if (resident.organizationId) {
      const communities = communitiesByOrganization[resident.organizationId];
      if (communities && communities.length > 0) {
        return communities[0].name;
      }
    }
    return null;
  };

  // Debug: Mostrar estructura de datos recibida
  console.log('🔍 [ResidentsPage] Debug de datos recibidos:');
  console.log('- Total usuarios:', residents.length);
  if (residents.length > 0) {
    console.log('- Primer usuario completo:', JSON.stringify(residents[0], null, 2));
    console.log('- Estructura de roles:', residents[0]?.roles);
    console.log('- Estructura de userUnits:', residents[0]?.userUnits);
    console.log('- Estructura de communityAdmins:', residents[0]?.communityAdmins);
  }

  // Filtrar residentes (solo si no estamos usando paginación)
  const filteredResidents = useMemo(() => {
    // Si estamos usando paginación, los filtros se aplican en el backend
    if (
      paginatedUsersQuery.data &&
      typeof paginatedUsersQuery.data === 'object' &&
      'users' in paginatedUsersQuery.data
    ) {
      return residents;
    }

    // Si no hay paginación, aplicar filtros localmente
    return residents.filter((resident: UserResponseDto) => {
      const matchesSearch =
        resident.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        resident.email.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' || resident.status === filters.status;
      // Por ahora no filtramos por rol ya que el backend no tiene esa información en User
      const matchesRole = true; // filters.role === 'all' || resident.role === filters.role;
      const matchesBuilding = true; // Por ahora no tenemos información de edificio

      return matchesSearch && matchesStatus && matchesRole && matchesBuilding;
    });
  }, [residents, filters, paginatedUsersQuery.data]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = residents.length;
    const active = residents.filter((r: UserResponseDto) => r.status === 'ACTIVE').length;
    const inactive = residents.filter((r: UserResponseDto) => r.status === 'INACTIVE').length;
    const suspended = residents.filter((r: UserResponseDto) => r.status === 'SUSPENDED').length;

    return { total, active, inactive, suspended };
  }, [residents]);

  const handleViewResident = (resident: UserResponseDto) => {
    setSelectedResident(resident);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditResident = (resident: UserResponseDto) => {
    setSelectedResident(resident);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreateResident = () => {
    setSelectedResident(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleDeleteResident = (resident: UserResponseDto) => {
    setResidentToDelete(resident);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (residentToDelete) {
      deleteUserMutation.mutate(residentToDelete.id, {
        onSuccess: () => {
          showSuccessToast('Residente eliminado con éxito ✅');
        },
        onError: (error) => {
          console.error('Error al eliminar residente:', error);
          showErrorToast('Error al eliminar el residente');
        },
      });
      setIsDeleteModalOpen(false);
      setResidentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setResidentToDelete(null);
  };

  // Funciones de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({ ...prev, status: status as ResidentFilters['status'] }));
    setCurrentPage(1); // Reset a la primera página al filtrar
  };

  const handleRoleChange = (role: string) => {
    setFilters((prev) => ({ ...prev, role: role as ResidentFilters['role'] }));
    setCurrentPage(1); // Reset a la primera página al filtrar
  };

  const handleSaveResident = async (residentData: any) => {
    try {
      if (modalMode === 'create') {
        // Cerrar modal inmediatamente con optimistic update
        setIsModalOpen(false);
        // Mostrar toast de éxito inmediatamente
        showSuccessToast('Residente creado con éxito ✅');
        // Ejecutar mutación en segundo plano
        createUserMutation.mutate(residentData, {
          onError: (error) => {
            console.error('Error al crear residente:', error);
            showErrorToast('Error al crear el residente');
          },
        });
      } else if (modalMode === 'edit' && selectedResident) {
        await updateUserMutation.mutateAsync({
          id: selectedResident.id,
          userData: residentData,
        });
        // Mostrar toast de éxito
        showSuccessToast('Usuario actualizado con éxito ✅');
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error al guardar residente:', error);
      // Mostrar toast de error
      showErrorToast('Error al guardar los cambios');
    }
  };

  const showSuccessToast = (message: string) => {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full opacity-0';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    }, 100);

    // Remover después de 3 segundos
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const showErrorToast = (message: string) => {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full opacity-0';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    }, 100);

    // Remover después de 4 segundos
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 4000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'INACTIVE':
        return 'Inactivo';
      case 'SUSPENDED':
        return 'Suspendido';
      default:
        return status;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'COMMUNITY_ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'RESIDENT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'CONCIERGE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'OWNER':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'TENANT':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleText = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'COMMUNITY_ADMIN':
        return 'Admin Comunidad';
      case 'RESIDENT':
        return 'Residente';
      case 'CONCIERGE':
        return 'Portero';
      case 'OWNER':
        return 'Propietario';
      case 'TENANT':
        return 'Inquilino';
      default:
        return 'Usuario';
    }
  };

  // Manejo de estados de carga y error
  if (isLoading || paginatedUsersQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 dark:bg-gray-600 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-600"></div>
          </div>
        </div>
        <UsersTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <ErrorMessage
          message="Error al cargar los residentes. Por favor, intenta de nuevo."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <RoleGuard requiredPermission="manage_community_users">
        <DashboardLayout>
          <div className="space-y-8 animate-fade-in">
            {/* Header moderno */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-100 dark:border-gray-700 animate-slide-down">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400"
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
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Gestión de Residentes
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                      Administra los residentes de la comunidad
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <ExportButton residents={residents} filteredResidents={filteredResidents} />
                  <button
                    onClick={handleCreateResident}
                    disabled={createUserMutation.isPending}
                    className="group relative inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      {createUserMutation.isPending ? 'Creando...' : '+ Nuevo Residente'}
                    </span>
                    <span className="sm:hidden">
                      {createUserMutation.isPending ? 'Creando...' : '+ Nuevo'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Métricas modernas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-fade-in-up">
              {/* Total */}
              <div className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
                      <svg
                        className="w-5 h-5 sm:w-7 sm:h-7 text-white"
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
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activos */}
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl shadow-lg">
                      <svg
                        className="w-5 h-5 sm:w-7 sm:h-7 text-white"
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
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                        Activos
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.active}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suspendidos */}
              <div className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg sm:rounded-xl shadow-lg">
                      <svg
                        className="w-5 h-5 sm:w-7 sm:h-7 text-white"
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
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                        Suspendidos
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.suspended}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inactivos */}
              <div className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg sm:rounded-xl shadow-lg">
                      <svg
                        className="w-5 h-5 sm:w-7 sm:h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                        Inactivos
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.inactive}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros modernos */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Filtros y Búsqueda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Búsqueda */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Buscar
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Nombre, email, apartamento..."
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Estado
                    </label>
                    <div className="relative">
                      <select
                        value={filters.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer"
                      >
                        <option value="all">Todos los estados</option>
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                        <option value="SUSPENDED">Suspendido</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Rol
                    </label>
                    <div className="relative">
                      <select
                        value={filters.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer"
                      >
                        <option value="all">Todos los roles</option>
                        <option value="owner">Propietario</option>
                        <option value="tenant">Inquilino</option>
                        <option value="guest">Invitado</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Edificio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Edificio
                    </label>
                    <div className="relative">
                      <select
                        value={filters.building}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, building: e.target.value }))
                        }
                        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer"
                      >
                        <option value="all">Todos los edificios</option>
                        <option value="Edificio Norte">Edificio Norte</option>
                        <option value="Edificio Sur">Edificio Sur</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla moderna de residentes */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Residentes
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {paginationData.total > 0
                          ? `Mostrando ${residents.length} de ${paginationData.total} residentes`
                          : `${filteredResidents.length} de ${residents.length} residentes`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista Desktop - Tabla */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Residente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Unidad/Comunidad
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha Ingreso
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredResidents.map((resident: UserResponseDto) => (
                      <tr
                        key={resident.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 group"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                                <span className="text-lg font-bold text-white">
                                  {resident.name
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {resident.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {resident.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                              <svg
                                className="w-4 h-4 text-gray-500 dark:text-gray-400"
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
                              {/* Mostrar información de unidad/comunidad */}
                              {(() => {
                                // Si tiene unidades asignadas, mostrar número de unidad
                                if (resident.userUnits && resident.userUnits.length > 0) {
                                  return (
                                    <>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {resident.userUnits
                                          .map((userUnit: UserUnit) => userUnit.unit?.number)
                                          .filter(Boolean)
                                          .join(', ')}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {resident.userUnits
                                          .map(
                                            (userUnit: UserUnit) => userUnit.unit?.community?.name,
                                          )
                                          .filter(Boolean)
                                          .join(', ')}
                                      </div>
                                    </>
                                  );
                                }

                                // Si es administrador de comunidad, mostrar comunidades
                                if (
                                  resident.communityAdmins &&
                                  resident.communityAdmins.length > 0
                                ) {
                                  return (
                                    <>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        Comunidades
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        <CommunitiesDisplay
                                          communities={resident.communityAdmins
                                            .map((ca: CommunityAdmin) => ({
                                              id: ca.community?.id || '',
                                              name: ca.community?.name || '',
                                              address: ca.community?.address || '',
                                            }))
                                            .filter(
                                              (community: { name: string }) => community.name,
                                            )}
                                          maxDisplay={1}
                                        />
                                      </div>
                                    </>
                                  );
                                }

                                // Si tiene organización pero no unidad ni comunidad admin, mostrar "Sin unidad"
                                if (resident.organizationId) {
                                  const communityName = getRegisteredCommunityName(resident);
                                  return (
                                    <>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        Sin unidad
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {communityName || 'Registrado'}
                                      </div>
                                    </>
                                  );
                                }

                                // Sin ninguna relación
                                return (
                                  <>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      Sin unidad
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Sin asignar
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(resident.status)}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${resident.status === 'ACTIVE' ? 'bg-green-500' : resident.status === 'SUSPENDED' ? 'bg-yellow-500' : 'bg-red-500'}`}
                            ></div>
                            {getStatusText(resident.status)}
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(resident.roles?.[0]?.role?.name || 'RESIDENT')}`}
                          >
                            <svg
                              className="w-3 h-3 mr-1.5"
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
                            {getRoleText(resident.roles?.[0]?.role?.name || 'RESIDENT')}
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-4 h-4 text-gray-400"
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
                            <span className="text-sm text-gray-900 dark:text-white">
                              {resident.phone || 'No disponible'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(resident.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => handleViewResident(resident)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                              title="Ver detalles"
                            >
                              <svg
                                className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditResident(resident)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 group"
                              title="Editar"
                            >
                              <svg
                                className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteResident(resident)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
                              title="Eliminar"
                            >
                              <svg
                                className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {paginationData.totalPages > 1 && (
                <Pagination
                  currentPage={paginationData.page}
                  totalPages={paginationData.totalPages}
                  totalItems={paginationData.total}
                  itemsPerPage={paginationData.limit}
                  onPageChange={handlePageChange}
                  isLoading={paginatedUsersQuery.isLoading}
                />
              )}

              {/* Vista Mobile - Cards */}
              <div className="lg:hidden space-y-4">
                {filteredResidents.map((resident: UserResponseDto) => (
                  <div
                    key={resident.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 hover:shadow-xl transition-all duration-200"
                  >
                    {/* Avatar y nombre */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-white">
                          {resident.name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {resident.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {resident.email}
                        </p>
                      </div>
                    </div>

                    {/* Información en grid compacto */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Estado
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(resident.status)}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${resident.status === 'ACTIVE' ? 'bg-green-500' : resident.status === 'SUSPENDED' ? 'bg-yellow-500' : 'bg-red-500'}`}
                          ></div>
                          {getStatusText(resident.status)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Teléfono
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {resident.phone || 'No disponible'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Unidad
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {(() => {
                            // Si tiene unidades asignadas, mostrar número de unidad
                            if (resident.userUnits && resident.userUnits.length > 0) {
                              return resident.userUnits
                                .map((userUnit: UserUnit) => userUnit.unit?.number)
                                .filter(Boolean)
                                .join(', ');
                            }

                            // Si tiene organización pero no unidad, mostrar "Sin unidad"
                            if (resident.organizationId) {
                              const communityName = getRegisteredCommunityName(resident);
                              return communityName ? `${communityName} (Sin unidad)` : 'Sin unidad';
                            }

                            // Sin ninguna relación
                            return 'Sin unidad';
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Rol
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(resident.roles?.[0]?.role?.name || 'RESIDENT')}`}
                        >
                          {getRoleText(resident.roles?.[0]?.role?.name || 'RESIDENT')}
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewResident(resident)}
                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                        title="Ver detalles"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditResident(resident)}
                        className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
                        title="Editar"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteResident(resident)}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        title="Eliminar"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredResidents.length === 0 && (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-12 h-12 text-gray-400"
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No hay residentes
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    No se encontraron residentes que coincidan con los filtros seleccionados.
                  </p>
                  <button
                    onClick={handleCreateResident}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Agregar primer residente
                  </button>
                </div>
              )}
            </div>

            {/* Modal de Usuario */}
            <UserModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              mode={modalMode}
              user={selectedResident}
              onSave={handleSaveResident}
              isLoading={createUserMutation.isPending || updateUserMutation.isPending}
            />

            {/* Modal de confirmación de eliminación */}
            <ConfirmDeleteModal
              isOpen={isDeleteModalOpen}
              onClose={handleCancelDelete}
              onConfirm={handleConfirmDelete}
              title="Eliminar Residente"
              message="Se eliminará permanentemente este residente y toda su información asociada."
              itemName={
                residentToDelete
                  ? `${residentToDelete.name} (${residentToDelete.email})`
                  : undefined
              }
              isLoading={deleteUserMutation.isPending}
            />
          </div>
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
