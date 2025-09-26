import { Module } from '@nestjs/common';

// Use Cases
import { CreateRoleUseCase } from '../application/use-cases/create-role.use-case';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetAllRolesUseCase } from '../application/use-cases/get-all-roles.use-case';
import { GetAllUsersUseCase } from '../application/use-cases/get-all-users.use-case';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';

// Repositories
import { RolesController } from '../infrastructure/controllers/roles.controller';
import { UsersController } from '../infrastructure/controllers/users.controller';
import { RoleRepository } from '../infrastructure/repositories/role.repository';
import { UserRoleRepository } from '../infrastructure/repositories/user-role.repository';
import { UserRepository } from '../infrastructure/repositories/user.repository';

// Controllers
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, RolesController],
  providers: [
    // Use Cases
    CreateUserUseCase,
    GetUserUseCase,
    GetAllUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    CreateRoleUseCase,
    GetAllRolesUseCase,

    // Repositories
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'RoleRepository',
      useClass: RoleRepository,
    },
    {
      provide: 'UserRoleRepository',
      useClass: UserRoleRepository,
    },
  ],
  exports: [
    CreateUserUseCase,
    GetUserUseCase,
    GetAllUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    CreateRoleUseCase,
    GetAllRolesUseCase,
  ],
})
export class UsersModule {}
