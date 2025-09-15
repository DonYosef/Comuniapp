import { UserRole } from '../entities/user-role.entity';

export interface UserRoleRepository {
  create(userRole: UserRole): Promise<UserRole>;
  findByUserId(userId: string): Promise<UserRole[]>;
  findByRoleId(roleId: string): Promise<UserRole[]>;
  findByUserAndRole(userId: string, roleId: string): Promise<UserRole | null>;
  delete(id: string): Promise<void>;
  deleteByUserAndRole(userId: string, roleId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
