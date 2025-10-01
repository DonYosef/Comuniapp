import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { AuthorizationService } from '../auth/services/authorization.service';
import { RoleName as DomainRoleName } from '../domain/entities/role.entity';
import { PrismaService } from '../prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authorizationService: AuthorizationService,
  ) {}

  async findAll(organizationId?: string): Promise<any[]> {
    const where = organizationId ? { organizationId } : {};

    return this.prisma.user.findMany({
      where,
      include: {
        roles: {
          include: { role: true },
        },
        userUnits: {
          include: {
            unit: {
              include: { community: true },
            },
          },
        },
      },
    });
  }

  async create(createUserDto: CreateUserDto, createdByUserId: string): Promise<any> {
    console.log(
      '🔍 [UsersService] create - Datos recibidos:',
      JSON.stringify(createUserDto, null, 2),
    );
    console.log('🔍 [UsersService] create - createdByUserId:', createdByUserId);
    const { password, roleName, unitId, ...userData } = createUserDto;

    console.log('🔍 [UsersService] Después del destructuring:');
    console.log('- password:', password ? '[PRESENTE]' : '[AUSENTE]');
    console.log('- roleName:', roleName);
    console.log('- unitId:', unitId);
    console.log('- userData:', JSON.stringify(userData, null, 2));

    // Verificar permisos para crear usuario
    if (userData.organizationId) {
      const canCreate = await this.authorizationService.canCreateUserInOrganization(
        createdByUserId,
        userData.organizationId,
      );

      if (!canCreate) {
        throw new ForbiddenException('No tienes permisos para crear usuarios en esta organización');
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario
    const userDataToCreate: any = {
      ...userData,
      passwordHash,
    };

    const user = await this.prisma.user.create({
      data: userDataToCreate,
    });

    console.log('✅ [UsersService] Usuario creado con ID:', user.id);
    console.log('📊 [UsersService] Usuario creado - campos guardados:');
    console.log('- email:', user.email);
    console.log('- name:', user.name);
    console.log('- phone:', user.phone, '(tipo:', typeof user.phone, ')');
    console.log(
      '- organizationId:',
      user.organizationId,
      '(tipo:',
      typeof user.organizationId,
      ')',
    );
    console.log('- status:', user.status);

    // Asignar rol si se especifica, o asignar rol por defecto
    const roleToAssign = roleName ?? 'RESIDENT';
    console.log('🔍 [UsersService] Asignando rol:', roleToAssign, '(original:', roleName, ')');
    let role = await this.prisma.role.findUnique({ where: { name: roleToAssign } });
    if (!role && roleToAssign !== 'RESIDENT') {
      console.log('❌ [UsersService] Rol no encontrado:', roleToAssign, '→ intentando RESIDENT');
      role = await this.prisma.role.findUnique({ where: { name: 'RESIDENT' } });
    }
    if (role) {
      await this.prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
      console.log('✅ [UsersService] Rol asignado:', role.name);
    } else {
      console.log('❌ [UsersService] No se pudo asignar ningún rol');
    }

    // Asociar usuario con unidad si se especifica
    if (unitId) {
      // Verificar que la unidad existe y pertenece a la organización del usuario
      const unit = await this.prisma.unit.findUnique({
        where: { id: unitId },
        include: { community: true },
      });

      if (!unit) {
        throw new BadRequestException('La unidad especificada no existe');
      }

      if (userData.organizationId && unit.community.organizationId !== userData.organizationId) {
        throw new ForbiddenException('La unidad no pertenece a la organización especificada');
      }

      await this.prisma.userUnit.create({
        data: {
          userId: user.id,
          unitId: unitId,
        },
      });
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: { role: true },
        },
        userUnits: {
          include: {
            unit: {
              include: { community: true },
            },
          },
        },
      },
    });
  }

  async createCommunityUser(
    createUserDto: CreateUserDto,
    communityId: string,
    unitId: string,
    createdByUserId: string,
  ): Promise<any> {
    // Verificar que el creador puede gestionar usuarios de esta comunidad
    const canManage = await this.authorizationService.canManageCommunityUsers(
      createdByUserId,
      communityId,
    );

    if (!canManage) {
      throw new ForbiddenException('No tienes permisos para crear usuarios en esta comunidad');
    }

    // Obtener la organización de la comunidad
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new BadRequestException('Comunidad no encontrada');
    }

    // Crear usuario con la organización de la comunidad
    const user = await this.create(
      {
        ...createUserDto,
        organizationId: community.organizationId,
      },
      createdByUserId,
    );

    // Asociar usuario a la unidad
    await this.prisma.userUnit.create({
      data: {
        userId: user.id,
        unitId: unitId,
        status: 'PENDING',
      },
    });

    return user;
  }

  async assignRole(userId: string, roleName: DomainRoleName, assignedByUserId: string) {
    // Verificar permisos
    const canManage = await this.authorizationService.canCreateUserInOrganization(
      assignedByUserId,
      null, // Super admin puede asignar roles globalmente
    );

    if (!canManage) {
      throw new ForbiddenException('No tienes permisos para asignar roles');
    }

    const role = await this.prisma.role.findUnique({
      where: { name: roleName as RoleName },
    });

    if (!role) {
      throw new BadRequestException('Rol no encontrado');
    }

    return this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: role.id,
      },
    });
  }

  async assignCommunityAdmin(userId: string, communityId: string, assignedByUserId: string) {
    // Verificar permisos del asignador
    const canManage = await this.authorizationService.canCreateUserInOrganization(
      assignedByUserId,
      null, // Super admin puede asignar globalmente
    );

    if (!canManage) {
      throw new ForbiddenException('No tienes permisos para asignar administradores de comunidad');
    }

    // Verificar que el usuario existe y tiene rol COMMUNITY_ADMIN
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const hasCommunityAdminRole = user.roles.some((ur) => ur.role.name === 'COMMUNITY_ADMIN');
    if (!hasCommunityAdminRole) {
      throw new BadRequestException('El usuario debe tener rol COMMUNITY_ADMIN');
    }

    // Verificar que la comunidad existe
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new BadRequestException('Comunidad no encontrada');
    }

    // Crear la relación CommunityAdmin
    return this.prisma.communityAdmin.create({
      data: {
        userId: userId,
        communityId: communityId,
      },
      include: {
        community: true,
        user: true,
      },
    });
  }

  async getCommunityAdmins(communityId: string, requestingUserId: string) {
    // Verificar permisos
    const canManage = await this.authorizationService.canManageCommunityUsers(
      requestingUserId,
      communityId,
    );

    if (!canManage) {
      throw new ForbiddenException('No tienes permisos para ver administradores de esta comunidad');
    }

    return this.prisma.communityAdmin.findMany({
      where: { communityId },
      include: {
        user: {
          include: {
            roles: {
              include: { role: true },
            },
          },
        },
        community: true,
      },
    });
  }

  async removeCommunityAdmin(userId: string, communityId: string, removedByUserId: string) {
    // Verificar permisos
    const canManage = await this.authorizationService.canManageCommunityUsers(
      removedByUserId,
      communityId,
    );

    if (!canManage) {
      throw new ForbiddenException(
        'No tienes permisos para remover administradores de esta comunidad',
      );
    }

    return this.prisma.communityAdmin.delete({
      where: {
        communityId_userId: {
          communityId: communityId,
          userId: userId,
        },
      },
    });
  }
}
