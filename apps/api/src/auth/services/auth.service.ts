import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { User } from '../../domain/entities/user.entity';
import { UserStatus } from '../../domain/entities/user.entity';
import { PrismaService } from '../../prisma/prisma.service';

export interface LoginResponse {
  user: User;
  accessToken: string;
  organizationId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return new User(
      user.id,
      user.email,
      user.name,
      user.passwordHash,
      user.status as UserStatus,
      user.organizationId,
      user.phone,
      user.createdAt,
      user.updatedAt,
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Obtener información completa del usuario con roles y permisos
    const userWithRoles = await this.getUserWithRoles(user.id);

    if (!userWithRoles) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Crear payload con información de roles y permisos
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: userWithRoles.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions,
      })),
    };

    const accessToken = this.jwtService.sign(payload);

    // Crear objeto de usuario con roles y permisos
    const userWithPermissions = new User(
      user.id,
      user.email,
      user.name,
      user.passwordHash,
      user.status as UserStatus,
      user.organizationId,
      user.phone,
      user.createdAt,
      user.updatedAt,
    );

    // Agregar roles y comunidades al objeto de usuario
    (userWithPermissions as any).roles = userWithRoles.roles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      permissions: ur.role.permissions,
    }));

    (userWithPermissions as any).communities =
      userWithRoles.communityAdmins?.map((ca) => ({
        id: ca.community.id,
        name: ca.community.name,
        address: ca.community.address,
        isActive: ca.community.isActive,
      })) || [];

    return {
      user: userWithPermissions,
      accessToken,
      organizationId: user.organizationId || undefined,
    };
  }

  async getUserWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
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
    });
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserWithRoles(userId);
    return user?.roles.some((ur) => ur.role.name === 'SUPER_ADMIN') || false;
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.getUserWithRoles(userId);
    return user?.roles.some((ur) => ur.role.name === roleName) || false;
  }
}
