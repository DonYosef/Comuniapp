import { Controller, Get, Post, Body, Request, UseGuards, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { Permission } from '../domain/entities/role.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission(Permission.MANAGE_ALL_USERS)
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.organizationId);
  }

  @Post()
  @RequirePermission(Permission.MANAGE_ALL_USERS)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    console.log('🚀 [UsersController] ===== PETICIÓN RECIBIDA =====');
    console.log('🚀 [UsersController] Endpoint: POST /users');
    console.log('🚀 [UsersController] Usuario autenticado:', req.user?.id);
    console.log('🚀 [UsersController] Roles del usuario:', req.user?.roles);
    console.log(
      '🔍 [UsersController] Datos recibidos en controlador:',
      JSON.stringify(createUserDto, null, 2),
    );
    console.log('📊 [UsersController] Análisis de campos en controlador:');
    console.log('- email:', createUserDto.email, '(tipo:', typeof createUserDto.email, ')');
    console.log('- name:', createUserDto.name, '(tipo:', typeof createUserDto.name, ')');
    console.log('- phone:', createUserDto.phone, '(tipo:', typeof createUserDto.phone, ')');
    console.log(
      '- organizationId:',
      createUserDto.organizationId,
      '(tipo:',
      typeof createUserDto.organizationId,
      ')',
    );
    console.log(
      '- roleName:',
      createUserDto.roleName,
      '(tipo:',
      typeof createUserDto.roleName,
      ')',
    );
    console.log('- unitId:', createUserDto.unitId, '(tipo:', typeof createUserDto.unitId, ')');

    // Verificaciones específicas para roleName
    console.log('🔍 [UsersController] Verificaciones específicas de roleName:');
    console.log('- roleName === undefined:', createUserDto.roleName === undefined);
    console.log('- roleName === null:', createUserDto.roleName === null);
    console.log('- roleName === "COMMUNITY_ADMIN":', createUserDto.roleName === 'COMMUNITY_ADMIN');
    console.log('- roleName === "RESIDENT":', createUserDto.roleName === 'RESIDENT');

    // Escribir logs a archivo para debug del controlador
    const fs = require('fs');
    const controllerLogData = `
=== CONTROLLER DEBUG LOG ${new Date().toISOString()} ===
Datos recibidos en controlador: ${JSON.stringify(createUserDto, null, 2)}
User ID: ${req.user?.id}
Phone: ${createUserDto.phone} (tipo: ${typeof createUserDto.phone})
OrganizationId: ${createUserDto.organizationId} (tipo: ${typeof createUserDto.organizationId})
RoleName: ${createUserDto.roleName} (tipo: ${typeof createUserDto.roleName})
===========================
`;
    fs.appendFileSync('debug-controller.log', controllerLogData);

    return this.usersService.create(createUserDto, req.user.id);
  }

  @Post('community/:communityId/unit/:unitId')
  @RequirePermission(Permission.MANAGE_COMMUNITY_USERS)
  @ApiOperation({ summary: 'Crear usuario en comunidad específica' })
  @ApiResponse({ status: 201, description: 'Usuario creado en comunidad exitosamente' })
  createCommunityUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.usersService.createCommunityUser(createUserDto, communityId, unitId, req.user.id);
  }

  @Post('test-debug')
  @ApiOperation({ summary: 'Endpoint temporal para debug' })
  @ApiResponse({ status: 201, description: 'Usuario creado para debug' })
  async testDebug(@Body() createUserDto: any, @Request() req) {
    console.log('🔍 [DEBUG] Datos recibidos:', JSON.stringify(createUserDto, null, 2));
    console.log('🔍 [DEBUG] Tipos de datos:');
    console.log('- phone:', createUserDto.phone, '(tipo:', typeof createUserDto.phone, ')');
    console.log(
      '- organizationId:',
      createUserDto.organizationId,
      '(tipo:',
      typeof createUserDto.organizationId,
      ')',
    );

    // Crear usuario directamente con Prisma para bypass el servicio
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const timestamp = Date.now();
      const userData = {
        email: `debug-${timestamp}@comuniapp.com`,
        name: 'Debug Test',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8.8.8.8.8',
        status: 'ACTIVE',
        phone: createUserDto.phone,
        organizationId: createUserDto.organizationId,
      };

      console.log('🔍 [DEBUG] Datos para Prisma:', JSON.stringify(userData, null, 2));

      const user = await prisma.user.create({
        data: userData,
      });

      console.log('✅ [DEBUG] Usuario creado:', JSON.stringify(user, null, 2));

      return user;
    } finally {
      await prisma.$disconnect();
    }
  }

  @Post('community-admin/:userId/assign/:communityId')
  @RequirePermission(Permission.MANAGE_ALL_USERS)
  @ApiOperation({ summary: 'Asignar administrador de comunidad' })
  @ApiResponse({ status: 201, description: 'Administrador asignado exitosamente' })
  assignCommunityAdmin(
    @Param('userId') userId: string,
    @Param('communityId') communityId: string,
    @Request() req,
  ) {
    return this.usersService.assignCommunityAdmin(userId, communityId, req.user.id);
  }

  @Get('community-admin/:communityId')
  @RequirePermission(Permission.MANAGE_COMMUNITY_USERS)
  @ApiOperation({ summary: 'Obtener administradores de comunidad' })
  @ApiResponse({ status: 200, description: 'Lista de administradores' })
  getCommunityAdmins(@Param('communityId') communityId: string, @Request() req) {
    return this.usersService.getCommunityAdmins(communityId, req.user.id);
  }

  @Delete('community-admin/:userId/:communityId')
  @RequirePermission(Permission.MANAGE_COMMUNITY_USERS)
  @ApiOperation({ summary: 'Remover administrador de comunidad' })
  @ApiResponse({ status: 200, description: 'Administrador removido exitosamente' })
  removeCommunityAdmin(
    @Param('userId') userId: string,
    @Param('communityId') communityId: string,
    @Request() req,
  ) {
    return this.usersService.removeCommunityAdmin(userId, communityId, req.user.id);
  }
}
