import { Injectable } from '@nestjs/common';

import { User, UserStatus } from '../../domain/entities/user.entity';
import { UserRepository as IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        status: user.status,
        organizationId: user.organizationId,
        phone: user.phone,
      },
    });

    return this.toDomainEntity(created);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toDomainEntity(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.toDomainEntity(user) : null;
  }

  async findAll(organizationId?: string): Promise<User[]> {
    const where = organizationId ? { organizationId } : {};

    // Logs removidos para mejorar rendimiento

    // Optimización: Usar select específico para reducir transferencia de datos
    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        // Solo cargar roles básicos, no todas las relaciones
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
              },
            },
          },
        },
        // Cargar solo información básica de unidades
        userUnits: {
          select: {
            id: true,
            unit: {
              select: {
                id: true,
                number: true,
                community: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        // Solo comunidades activas
        communityAdmins: {
          where: {
            community: {
              isActive: true,
              deletedAt: null,
            },
          },
          select: {
            id: true,
            community: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Logs removidos para mejorar rendimiento

    return users.map((user) => this.toDomainEntity(user));
  }

  async findAllPaginated(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<{ users: any[]; total: number }> {
    const { page, limit, search, status, role } = filters;
    const skip = (page - 1) * limit;

    // Asegurar que limit sea un número entero
    const limitNumber = parseInt(limit.toString(), 10);

    // Construir filtros dinámicos
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    console.log('🔍 [UserRepository] findAllPaginated - filtros:', JSON.stringify(where, null, 2));

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          status: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
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
          communityAdmins: {
            include: {
              community: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    console.log(
      `✅ [UserRepository] findAllPaginated - página ${page}/${Math.ceil(total / limit)}: ${users.length} usuarios de ${total} totales`,
    );

    return { users, total };
  }

  async update(user: User): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        name: user.name,
        status: user.status,
        updatedAt: user.updatedAt,
      },
    });

    return this.toDomainEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.toDomainEntity(user));
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId: userId,
        roleId: roleId,
      },
    });
  }

  async assignUnit(userId: string, unitId: string): Promise<void> {
    await this.prisma.userUnit.create({
      data: {
        userId: userId,
        unitId: unitId,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });
  }

  async findAllCommunityAdmins(): Promise<User[]> {
    console.log(
      '🔍 [UserRepository] findAllCommunityAdmins - buscando todos los administradores de comunidad',
    );

    const communityAdmins = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: 'COMMUNITY_ADMIN',
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
        communityAdmins: {
          where: {
            community: {
              isActive: true,
              deletedAt: null,
            },
          },
          include: {
            community: true,
          },
        },
      },
    });

    console.log(
      `🔍 [UserRepository] findAllCommunityAdmins - encontrados ${communityAdmins.length} administradores de comunidad`,
    );
    return communityAdmins.map((user) => this.toDomainEntity(user));
  }

  async findAllUsersFromCreatedCommunities(createdByUserId: string): Promise<User[]> {
    console.log(
      '🔍 [UserRepository] findAllUsersFromCreatedCommunities - creador:',
      createdByUserId,
    );

    // Primero, obtener todas las comunidades creadas por este usuario
    const createdCommunities = await this.prisma.community.findMany({
      where: {
        createdById: createdByUserId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(
      `🔍 [UserRepository] findAllUsersFromCreatedCommunities - comunidades creadas: ${createdCommunities.length}`,
    );
    createdCommunities.forEach((community) => {
      console.log(`   - ${community.name} (${community.id})`);
    });

    if (createdCommunities.length === 0) {
      console.log(
        '🔍 [UserRepository] findAllUsersFromCreatedCommunities - no hay comunidades creadas, devolviendo lista vacía',
      );
      return [];
    }

    const communityIds = createdCommunities.map((c) => c.id);

    // Buscar todos los usuarios que están asociados a unidades de estas comunidades
    const users = await this.prisma.user.findMany({
      where: {
        userUnits: {
          some: {
            unit: {
              communityId: {
                in: communityIds,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
        communityAdmins: {
          where: {
            community: {
              isActive: true,
              deletedAt: null,
            },
          },
          include: {
            community: true,
          },
        },
      },
    });

    console.log(
      `🔍 [UserRepository] findAllUsersFromCreatedCommunities - encontrados ${users.length} usuarios en las comunidades creadas`,
    );
    return users.map((user) => this.toDomainEntity(user));
  }

  async findAllUsersFromCreatedCommunitiesPaginated(
    createdByUserId: string,
    filters: {
      page: number;
      limit: number;
      search?: string;
      status?: string;
      role?: string;
    },
  ): Promise<{ users: any[]; total: number }> {
    const { page, limit, search, status, role } = filters;
    const skip = (page - 1) * limit;

    // Asegurar que limit sea un número entero
    const limitNumber = parseInt(limit.toString(), 10);

    console.log(
      '🔍 [UserRepository] findAllUsersFromCreatedCommunitiesPaginated - creador:',
      createdByUserId,
      'filtros:',
      filters,
    );

    // Primero, obtener todas las comunidades creadas por este usuario
    const createdCommunities = await this.prisma.community.findMany({
      where: {
        createdById: createdByUserId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (createdCommunities.length === 0) {
      console.log(
        '🔍 [UserRepository] findAllUsersFromCreatedCommunitiesPaginated - no hay comunidades creadas',
      );
      return { users: [], total: 0 };
    }

    const communityIds = createdCommunities.map((c) => c.id);

    // Construir filtros dinámicos
    const where: any = {
      userUnits: {
        some: {
          unit: {
            communityId: {
              in: communityIds,
            },
          },
        },
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    console.log(
      '🔍 [UserRepository] findAllUsersFromCreatedCommunitiesPaginated - filtros:',
      JSON.stringify(where, null, 2),
    );

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          status: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
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
          communityAdmins: {
            include: {
              community: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    console.log(
      `✅ [UserRepository] findAllUsersFromCreatedCommunitiesPaginated - página ${page}/${Math.ceil(total / limit)}: ${users.length} usuarios de ${total} totales`,
    );

    return { users, total };
  }

  private toDomainEntity(prismaUser: any): User {
    const user = new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.name,
      prismaUser.passwordHash,
      prismaUser.status as UserStatus,
      prismaUser.organizationId || null,
      prismaUser.phone || null,
      prismaUser.createdAt,
      prismaUser.updatedAt,
    );

    // Preservar las relaciones que vienen de Prisma
    if (prismaUser.roles) {
      (user as any).roles = prismaUser.roles;
    }
    if (prismaUser.userUnits) {
      (user as any).userUnits = prismaUser.userUnits;
    }
    if (prismaUser.communityAdmins) {
      (user as any).communityAdmins = prismaUser.communityAdmins;
    }

    return user;
  }
}
