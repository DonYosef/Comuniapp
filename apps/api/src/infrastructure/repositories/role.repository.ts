import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../domain/entities/role.entity';
import { RoleRepository as IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { RoleName } from '@prisma/client';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(role: Role): Promise<Role> {
    const created = await this.prisma.role.create({
      data: {
        name: role.name as RoleName,
        description: role.description,
        permissions: role.permissions,
      },
    });

    return this.toDomainEntity(created);
  }

  async findById(id: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    return role ? this.toDomainEntity(role) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { name: name as RoleName },
    });

    return role ? this.toDomainEntity(role) : null;
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return roles.map((role) => this.toDomainEntity(role));
  }

  async update(role: Role): Promise<Role> {
    const updated = await this.prisma.role.update({
      where: { id: role.id },
      data: {
        name: role.name as RoleName,
        description: role.description,
        permissions: role.permissions,
        updatedAt: role.updatedAt,
      },
    });

    return this.toDomainEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({
      where: { id },
    });
  }

  private toDomainEntity(prismaRole: any): Role {
    return new Role(
      prismaRole.id,
      prismaRole.name,
      prismaRole.description,
      prismaRole.permissions,
      prismaRole.createdAt,
      prismaRole.updatedAt,
    );
  }
}
