import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RoleName } from '../../node_modules/.prisma/client';
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
    const { password, roleName, unitId, ...userData } = createUserDto;

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

    // Asignar rol si se especifica
    if (roleName) {
      const role = await this.prisma.role.findUnique({
        where: { name: roleName },
      });

      if (role) {
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }
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

  async getUsersByCommunity(communityId: string, requestingUserId: string): Promise<any[]> {
    // Verificar permisos
    const canManage = await this.authorizationService.canManageCommunityUsers(
      requestingUserId,
      communityId,
    );

    if (!canManage) {
      throw new ForbiddenException('No tienes permisos para ver usuarios de esta comunidad');
    }

    return this.prisma.user.findMany({
      where: {
        userUnits: {
          some: {
            unit: {
              communityId: communityId,
            },
          },
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
        userUnits: {
          include: {
            unit: true,
          },
        },
      },
    });
  }
}
