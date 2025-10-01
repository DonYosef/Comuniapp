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

    console.log('🔍 [UserRepository] findAll - organizationId:', organizationId);
    console.log('🔍 [UserRepository] findAll - where clause:', JSON.stringify(where, null, 2));

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`🔍 [UserRepository] findAll - encontrados ${users.length} usuarios`);
    if (organizationId) {
      const usersWithOrg = users.filter((user) => user.organizationId === organizationId);
      console.log(
        `🔍 [UserRepository] findAll - usuarios con organizationId ${organizationId}: ${usersWithOrg.length}`,
      );
    }

    return users.map((user) => this.toDomainEntity(user));
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
        status: 'PENDING',
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
    });

    console.log(
      `🔍 [UserRepository] findAllUsersFromCreatedCommunities - encontrados ${users.length} usuarios en las comunidades creadas`,
    );
    return users.map((user) => this.toDomainEntity(user));
  }

  private toDomainEntity(prismaUser: any): User {
    return new User(
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
  }
}
