import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { User } from '../../domain/entities/user.entity';
import { UserStatus } from '../../domain/entities/user.entity';

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
      user.createdAt,
      user.updatedAt,
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      user,
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
