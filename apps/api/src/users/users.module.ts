import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Use Cases
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case';
import { GetAllUsersUseCase } from '../application/use-cases/get-all-users.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { CreateRoleUseCase } from '../application/use-cases/create-role.use-case';
import { GetAllRolesUseCase } from '../application/use-cases/get-all-roles.use-case';

// Repositories
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { RoleRepository } from '../infrastructure/repositories/role.repository';
import { UserRoleRepository } from '../infrastructure/repositories/user-role.repository';

// Controllers
import { UsersController } from '../infrastructure/controllers/users.controller';
import { RolesController } from '../infrastructure/controllers/roles.controller';

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
