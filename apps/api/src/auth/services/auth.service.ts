import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { User } from '../../domain/entities/user.entity';
import { UserStatus } from '../../domain/entities/user.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { RegisterDto } from '../dto/register.dto';

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

    // Preparar comunidades para el payload
    const communitiesFromAdmins =
      userWithRoles.communityAdmins?.map((ca) => ({
        id: ca.community.id,
        name: ca.community.name,
        address: ca.community.address,
        isActive: ca.community.isActive,
        status: ca.community.isActive ? 'ACTIVE' : 'INACTIVE',
      })) || [];

    const isConcierge = userWithRoles.roles.some((ur) => ur.role.name === 'CONCIERGE');
    let communitiesFromUnits: any[] = [];

    if (isConcierge && communitiesFromAdmins.length === 0 && userWithRoles.userUnits?.length > 0) {
      const communityMap = new Map();
      userWithRoles.userUnits.forEach((uu) => {
        const community = uu.unit.community;
        if (!communityMap.has(community.id)) {
          communityMap.set(community.id, {
            id: community.id,
            name: community.name,
            address: community.address,
            isActive: community.isActive,
            status: community.isActive ? 'ACTIVE' : 'INACTIVE',
          });
        }
      });
      communitiesFromUnits = Array.from(communityMap.values());
    }

    const allCommunities = [...communitiesFromAdmins, ...communitiesFromUnits];
    const uniqueCommunities = allCommunities.filter(
      (community, index, self) => index === self.findIndex((c) => c.id === community.id),
    );

    // Crear payload con información de roles, permisos y comunidades
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      roles: userWithRoles.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions,
      })),
      communities: uniqueCommunities,
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

    // Agregar roles, comunidades y unidades al objeto de usuario
    (userWithPermissions as any).roles = userWithRoles.roles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      permissions: ur.role.permissions,
    }));

    // Usar las comunidades ya calculadas para el payload
    (userWithPermissions as any).communities = uniqueCommunities;

    (userWithPermissions as any).userUnits =
      userWithRoles.userUnits?.map((uu) => ({
        id: uu.id,
        unit: {
          id: uu.unit.id,
          number: uu.unit.number,
          floor: uu.unit.floor,
          community: {
            id: uu.unit.community.id,
            name: uu.unit.community.name,
            address: uu.unit.community.address,
          },
        },
      })) || [];

    console.log(
      '🔍 [AuthService] login - userWithPermissions:',
      JSON.stringify(userWithPermissions, null, 2),
    );
    console.log('🔍 [AuthService] login - userUnits:', (userWithPermissions as any).userUnits);

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

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    // Validar que las contraseñas coincidan
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El usuario con este email ya existe');
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Crear el usuario
    const newUser = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        passwordHash,
        status: UserStatus.ACTIVE,
        organizationId: registerDto.organizationId,
        phone: registerDto.phone,
        isActive: true,
      },
    });

    // Si se especifica una comunidad, obtener su organización y asignarla al usuario
    if (registerDto.communityId) {
      const community = await this.prisma.community.findUnique({
        where: { id: registerDto.communityId },
        select: { organizationId: true },
      });

      if (community && community.organizationId) {
        // Actualizar el usuario con la organización de la comunidad
        await this.prisma.user.update({
          where: { id: newUser.id },
          data: { organizationId: community.organizationId },
        });
      }
    }

    // Asignar rol por defecto (RESIDENT) si no se especifica organización
    if (!registerDto.organizationId) {
      const residentRole = await this.prisma.role.findFirst({
        where: { name: 'RESIDENT' },
      });

      if (residentRole) {
        await this.prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId: residentRole.id,
          },
        });
      }
    }

    return {
      message: 'Usuario registrado exitosamente',
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };
  }

  async getCommunitiesForRegistration() {
    // Obtener todas las comunidades activas disponibles para registro
    const communities = await this.prisma.community.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        type: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return communities.map((community) => ({
      id: community.id,
      name: community.name,
      address: community.address,
      type: community.type,
      organization: community.organization,
    }));
  }
}
