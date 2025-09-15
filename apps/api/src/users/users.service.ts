import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthorizationService } from '../auth/services/authorization.service';
import { RoleName as DomainRoleName } from '../domain/entities/role.entity';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authorizationService: AuthorizationService,
  ) {}

  async findAll(organizationId?: string) {
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

  async create(createUserDto: CreateUserDto, createdByUserId: string) {
    const { password, roleName, organizationId, ...userData } = createUserDto;

    // Verificar permisos para crear usuario
    if (organizationId) {
      const canCreate = await this.authorizationService.canCreateUserInOrganization(
        createdByUserId,
        organizationId,
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

    if (organizationId) {
      userDataToCreate.organizationId = organizationId;
    }

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

    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
  }

  async createCommunityUser(
    createUserDto: CreateUserDto,
    communityId: string,
    unitId: string,
    createdByUserId: string,
  ) {
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

  async getUsersByCommunity(communityId: string, requestingUserId: string) {
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
