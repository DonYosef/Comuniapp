import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../domain/entities/user-role.entity';
import { UserRoleRepository as IUserRoleRepository } from '../../domain/repositories/user-role.repository.interface';

@Injectable()
export class UserRoleRepository implements IUserRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userRole: UserRole): Promise<UserRole> {
    const created = await this.prisma.userRole.create({
      data: {
        userId: userRole.userId,
        roleId: userRole.roleId,
      },
    });

    return this.toDomainEntity(created);
  }

  async findByUserId(userId: string): Promise<UserRole[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
    });

    return userRoles.map((userRole) => this.toDomainEntity(userRole));
  }

  async findByRoleId(roleId: string): Promise<UserRole[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
    });

    return userRoles.map((userRole) => this.toDomainEntity(userRole));
  }

  async findByUserAndRole(userId: string, roleId: string): Promise<UserRole | null> {
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return userRole ? this.toDomainEntity(userRole) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: { id },
    });
  }

  async deleteByUserAndRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });
  }

  private toDomainEntity(prismaUserRole: any): UserRole {
    return new UserRole(prismaUserRole.id, prismaUserRole.userId, prismaUserRole.roleId);
  }
}
