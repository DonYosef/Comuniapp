import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { CreateRoleDto } from '../../application/dto/create-role.dto';
import { RoleResponseDto } from '../../application/dto/role-response.dto';
import { CreateRoleUseCase } from '../../application/use-cases/create-role.use-case';
import { GetAllRolesUseCase } from '../../application/use-cases/get-all-roles.use-case';
import { Role } from '../../domain/entities/role.entity';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({
    status: 201,
    description: 'Rol creado exitosamente',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El rol con este nombre ya existe',
  })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.createRoleUseCase.execute(createRoleDto);
    return this.toResponseDto(role);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles obtenida exitosamente',
    type: [RoleResponseDto],
  })
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.getAllRolesUseCase.execute();
    return roles.map((role) => this.toResponseDto(role));
  }

  private toResponseDto(role: Role): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
