import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { GetAllUsersUseCase } from '../../application/use-cases/get-all-users.use-case';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permission } from '../../domain/entities/role.entity';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Permission.MANAGE_ALL_USERS)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario con este email ya existe',
  })
  async create(@Body() createUserDto: CreateUserDto, @Request() req): Promise<UserResponseDto> {
    console.log('🚀 [InfrastructureUsersController] ===== PETICIÓN RECIBIDA =====');
    console.log('🚀 [InfrastructureUsersController] Endpoint: POST /users');
    console.log(
      '🚀 [InfrastructureUsersController] Datos recibidos:',
      JSON.stringify(createUserDto, null, 2),
    );
    console.log('🚀 [InfrastructureUsersController] Usuario autenticado:', req.user?.id);

    const user = await this.createUserUseCase.execute(createUserDto, req.user.id);
    console.log('✅ [InfrastructureUsersController] Usuario creado exitosamente:', user.id);

    return this.toResponseDto(user);
  }

  @Get()
  @RequirePermission(Permission.MANAGE_ALL_USERS, Permission.MANAGE_COMMUNITY_USERS)
  @ApiOperation({ summary: 'Obtener usuarios con paginación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    type: [UserResponseDto],
  })
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.log('🔍 [InfrastructureUsersController] Obteniendo usuarios con paginación...');
    console.log('🔍 [InfrastructureUsersController] Parámetros:', {
      page,
      limit,
      search,
      status,
      role,
    });
    console.log('🔍 [InfrastructureUsersController] Usuario:', req.user?.id);

    // Determinar qué usuarios puede ver basado en sus permisos según nueva lógica
    const isSuperAdmin = req.user?.roles?.some((role: any) => role.name === 'SUPER_ADMIN');
    const isCommunityAdmin = req.user?.roles?.some((role: any) => role.name === 'COMMUNITY_ADMIN');
    const isResident = req.user?.roles?.some((role: any) => role.name === 'RESIDENT');
    const isConcierge = req.user?.roles?.some((role: any) => role.name === 'CONCIERGE');

    let result: { users: any[]; total: number };

    if (isSuperAdmin) {
      console.log(
        '🔍 [InfrastructureUsersController] Usuario es SUPER_ADMIN - obteniendo usuarios paginados',
      );
      result = await this.userRepository.findAllPaginated({
        page,
        limit,
        search,
        status,
        role,
      });
    } else if (isCommunityAdmin) {
      console.log(
        '🔍 [InfrastructureUsersController] Usuario es COMMUNITY_ADMIN - obteniendo usuarios de comunidades creadas',
      );
      result = await this.userRepository.findAllUsersFromCreatedCommunitiesPaginated(req.user.id, {
        page,
        limit,
        search,
        status,
        role,
      });
    } else if (isResident || isConcierge) {
      console.log('🔍 [InfrastructureUsersController] Usuario es RESIDENT/CONCIERGE - sin acceso');
      result = { users: [], total: 0 };
    } else {
      console.log('🔍 [InfrastructureUsersController] Usuario sin rol reconocido - sin acceso');
      result = { users: [], total: 0 };
    }

    console.log(
      `✅ [InfrastructureUsersController] Obtenidos ${result.users.length} usuarios de ${result.total} totales`,
    );

    const totalPages = Math.ceil(result.total / limit);

    return {
      users: result.users.map((user) => this.toResponseDto(user)),
      total: result.total,
      page,
      limit,
      totalPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.getUserUseCase.execute(id);
    return this.toResponseDto(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserUseCase.execute(id, updateUserDto);
    return this.toResponseDto(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 204,
    description: 'Usuario eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUserUseCase.execute(id);
  }

  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      phone: user.phone,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: (user as any).roles,
      userUnits: (user as any).userUnits,
      communityAdmins: (user as any).communityAdmins,
    };
  }
}
