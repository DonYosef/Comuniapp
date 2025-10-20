import { User, UserStatus } from '../entities/user.entity';

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(organizationId?: string): Promise<User[]>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findByStatus(status: UserStatus): Promise<User[]>;
  existsByEmail(email: string): Promise<boolean>;
  assignRole(userId: string, roleId: string): Promise<void>;
  assignUnit(userId: string, unitId: string): Promise<void>;
  removeUserUnits(userId: string): Promise<void>;

  // Nuevos métodos para la lógica de negocio
  findAllCommunityAdmins(): Promise<User[]>;
  findAllUsersFromCreatedCommunities(createdByUserId: string): Promise<User[]>;

  // Métodos paginados para optimización
  findAllPaginated(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<{ users: any[]; total: number }>;
  findAllUsersFromCreatedCommunitiesPaginated(
    createdByUserId: string,
    filters: {
      page: number;
      limit: number;
      search?: string;
      status?: string;
      role?: string;
    },
  ): Promise<{ users: any[]; total: number }>;
}
