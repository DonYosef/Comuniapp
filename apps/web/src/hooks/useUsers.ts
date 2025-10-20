import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/services/userService';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '@/types/api';
import { useAuth } from './useAuth';

// Clave para el cache de usuarios
const USERS_QUERY_KEY = 'users';

// Hook para obtener todos los usuarios con optimizaciones de caché
export const useUsers = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USERS_QUERY_KEY],
    queryFn: UserService.getAllUsers,
    enabled: isAuthenticated, // Solo ejecutar si está autenticado
    staleTime: 15 * 60 * 1000, // 15 minutos (aumentado para mejor rendimiento)
    cacheTime: 30 * 60 * 1000, // 30 minutos en caché
    refetchOnWindowFocus: false,
    refetchOnMount: false, // No refetch si ya tenemos datos frescos
    retry: 1, // Solo reintentar una vez en caso de error
    retryDelay: 1000, // 1 segundo entre reintentos
  });
};

// Hook para obtener un usuario por ID
export const useUser = (id: string) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => UserService.getUserById(id),
    enabled: !!id && isAuthenticated,
  });
};

// Hook para crear un usuario
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) => UserService.createUser(userData),
    onMutate: async (newUserData) => {
      // Cancelar cualquier refetch en progreso para evitar conflictos
      await queryClient.cancelQueries({ queryKey: [USERS_QUERY_KEY] });

      // Obtener snapshot del cache actual
      const previousUsers = queryClient.getQueryData([USERS_QUERY_KEY]);

      // Crear un usuario temporal con datos optimistas
      const tempUser = {
        id: `temp-${Date.now()}`, // ID temporal
        ...newUserData,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roles: [],
        userUnits: [],
        communityAdmins: [],
      };

      // Función para agregar usuario optimistamente
      const addOptimistically = (old: any) => {
        if (!old) return old;

        // Si es un array simple (datos no paginados)
        if (Array.isArray(old)) {
          return [tempUser, ...old];
        }

        // Si es un objeto con paginación
        if (old && typeof old === 'object' && old.users && Array.isArray(old.users)) {
          return {
            ...old,
            users: [tempUser, ...old.users],
            total: old.total + 1,
          };
        }

        return old;
      };

      // Actualizar todas las queries relacionadas con usuarios
      queryClient.setQueryData([USERS_QUERY_KEY], addOptimistically);

      // También actualizar queries paginadas específicas
      queryClient.setQueriesData({ queryKey: [USERS_QUERY_KEY, 'paginated'] }, addOptimistically);

      // Retornar contexto para rollback en caso de error
      return { previousUsers };
    },
    onSuccess: (createdUser) => {
      // Reemplazar el usuario temporal con el usuario real del servidor
      const replaceTempUser = (old: any) => {
        if (!old) return old;

        // Si es un array simple (datos no paginados)
        if (Array.isArray(old)) {
          return old.map((user: any) => (user.id.startsWith('temp-') ? createdUser : user));
        }

        // Si es un objeto con paginación
        if (old && typeof old === 'object' && old.users && Array.isArray(old.users)) {
          return {
            ...old,
            users: old.users.map((user: any) => (user.id.startsWith('temp-') ? createdUser : user)),
          };
        }

        return old;
      };

      // Actualizar con el usuario real
      queryClient.setQueryData([USERS_QUERY_KEY], replaceTempUser);
      queryClient.setQueriesData({ queryKey: [USERS_QUERY_KEY, 'paginated'] }, replaceTempUser);
    },
    onError: (error, newUserData, context) => {
      // Rollback en caso de error
      if (context?.previousUsers) {
        queryClient.setQueryData([USERS_QUERY_KEY], context.previousUsers);
        // También hacer rollback de queries paginadas
        queryClient.setQueriesData(
          { queryKey: [USERS_QUERY_KEY, 'paginated'] },
          context.previousUsers,
        );
      }
      console.error('Error al crear usuario:', error);
    },
    onSettled: () => {
      // Invalidar para sincronizar con el servidor
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, 'paginated'] });
    },
  });
};

// Hook para actualizar un usuario
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: UpdateUserDto }) =>
      UserService.updateUser(id, userData),
    onSuccess: (updatedUser) => {
      // Actualizar el cache con el usuario actualizado
      queryClient.setQueryData([USERS_QUERY_KEY, updatedUser.id], updatedUser);
      // Invalidar la lista de usuarios para refetch
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error al actualizar usuario:', error);
    },
  });
};

// Hook para eliminar un usuario con eliminación optimista
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onMutate: async (deletedId) => {
      // Cancelar cualquier refetch en progreso para evitar conflictos
      await queryClient.cancelQueries({ queryKey: [USERS_QUERY_KEY] });

      // Obtener snapshot del cache actual
      const previousUsers = queryClient.getQueryData([USERS_QUERY_KEY]);

      // Función para actualizar datos optimistamente
      const updateOptimistically = (old: any) => {
        if (!old) return old;

        // Si es un array simple (datos no paginados)
        if (Array.isArray(old)) {
          return old.filter((user: any) => user.id !== deletedId);
        }

        // Si es un objeto con paginación
        if (old && typeof old === 'object' && old.users && Array.isArray(old.users)) {
          return {
            ...old,
            users: old.users.filter((user: any) => user.id !== deletedId),
            total: old.total - 1,
          };
        }

        return old;
      };

      // Actualizar todas las queries relacionadas con usuarios
      queryClient.setQueryData([USERS_QUERY_KEY], updateOptimistically);

      // También actualizar queries paginadas específicas
      queryClient.setQueriesData(
        { queryKey: [USERS_QUERY_KEY, 'paginated'] },
        updateOptimistically,
      );

      // Retornar contexto para rollback en caso de error
      return { previousUsers };
    },
    onError: (error, deletedId, context) => {
      // Rollback en caso de error
      if (context?.previousUsers) {
        queryClient.setQueryData([USERS_QUERY_KEY], context.previousUsers);
        // También hacer rollback de queries paginadas
        queryClient.setQueriesData(
          { queryKey: [USERS_QUERY_KEY, 'paginated'] },
          context.previousUsers,
        );
      }
      console.error('Error al eliminar usuario:', error);
    },
    onSettled: (_, __, deletedId) => {
      // Limpiar cache específico del usuario eliminado
      queryClient.removeQueries({ queryKey: [USERS_QUERY_KEY, deletedId] });
      // Invalidar todas las queries relacionadas con usuarios
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      // También invalidar queries paginadas
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, 'paginated'] });
    },
  });
};

// Hook para buscar usuarios
export const useSearchUsers = (query: string) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USERS_QUERY_KEY, 'search', query],
    queryFn: () => UserService.searchUsers(query),
    enabled: !!query && query.length > 2 && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para obtener usuarios por estado
export const useUsersByStatus = (status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USERS_QUERY_KEY, 'status', status],
    queryFn: () => UserService.getUsersByStatus(status),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener usuarios con paginación
export const useUsersPaginated = (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  } = {},
) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USERS_QUERY_KEY, 'paginated', params],
    queryFn: () => UserService.getUsersPaginated(params),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 1000,
  });
};
