import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Permission } from '../../domain/entities/role.entity';

@Injectable()
export class AuthorizationService {
  constructor(private prisma: PrismaService) {}

  async hasContextAccess(
    userId: string,
    contextId: string,
    permission: Permission,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return false;
    }

    // Super Admin tiene acceso total
    if (user.roles.some((ur) => ur.role.name === 'SUPER_ADMIN')) {
      return true;
    }

    // Verificar permisos específicos del contexto
    return this.checkContextPermission(user, contextId, permission);
  }

  private async checkContextPermission(
    user: any,
    contextId: string,
    permission: Permission,
  ): Promise<boolean> {
    // Verificar si el usuario tiene el permiso requerido
    const hasPermission = user.roles.some((ur: any) => ur.role.permissions.includes(permission));

    if (!hasPermission) {
      return false;
    }

    // Verificar acceso al contexto específico
    if (permission.includes('COMMUNITY')) {
      return this.hasCommunityAccess(user, contextId);
    }

    if (permission.includes('OWN_UNIT')) {
      return this.hasUnitAccess(user, contextId);
    }

    return true;
  }

  private hasCommunityAccess(user: any, communityId: string): boolean {
    // Community Admin puede acceder a sus comunidades
    if (user.roles.some((ur: any) => ur.role.name === 'COMMUNITY_ADMIN')) {
      return user.communityAdmins?.some((ca: any) => ca.communityId === communityId);
    }

    // Otros usuarios pueden acceder si tienen unidades en esa comunidad
    return user.userUnits?.some((uu: any) => uu.unit.communityId === communityId);
  }

  private hasUnitAccess(user: any, unitId: string): boolean {
    return user.userUnits?.some((uu: any) => uu.unitId === unitId);
  }

  async canManageCommunityUsers(userId: string, communityId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        communityAdmins: true,
      },
    });

    if (!user) return false;

    // Super Admin puede gestionar todos los usuarios
    if (user.roles.some((ur) => ur.role.name === 'SUPER_ADMIN')) {
      return true;
    }

    // Community Admin puede gestionar usuarios de sus comunidades
    if (user.roles.some((ur) => ur.role.name === 'COMMUNITY_ADMIN')) {
      return user.communityAdmins.some((ca) => ca.communityId === communityId);
    }

    return false;
  }

  async canCreateUserInOrganization(userId: string, organizationId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        organization: true,
      },
    });

    if (!user) return false;

    // Super Admin puede crear usuarios en cualquier organización
    if (user.roles.some((ur) => ur.role.name === 'SUPER_ADMIN')) {
      return true;
    }

    // Community Admin puede crear usuarios en su organización
    if (user.roles.some((ur) => ur.role.name === 'COMMUNITY_ADMIN')) {
      return user.organizationId === organizationId;
    }

    return false;
  }
}
