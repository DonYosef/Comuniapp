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
}
