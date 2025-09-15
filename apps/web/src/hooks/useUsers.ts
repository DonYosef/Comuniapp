import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/services/userService';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '@/types/api';
import { useAuth } from './useAuth';

// Clave para el cache de usuarios
const USERS_QUERY_KEY = 'users';

// Hook para obtener todos los usuarios
export const useUsers = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [USERS_QUERY_KEY],
    queryFn: UserService.getAllUsers,
    enabled: isAuthenticated, // Solo ejecutar si está autenticado
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
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
    onSuccess: () => {
      // Invalidar y refetch la lista de usuarios
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error al crear usuario:', error);
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

// Hook para eliminar un usuario
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: (_, deletedId) => {
      // Remover el usuario del cache
      queryClient.removeQueries({ queryKey: [USERS_QUERY_KEY, deletedId] });
      // Invalidar la lista de usuarios para refetch
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Error al eliminar usuario:', error);
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
