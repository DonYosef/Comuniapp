import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';

import { PlanType } from '../domain/entities/organization.entity';
import { PrismaService } from '../prisma/prisma.service';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto, createdByUserId: string) {
    // Verificar que el usuario es Super Admin
    const user = await this.prisma.user.findUnique({
      where: { id: createdByUserId },
      include: { roles: { include: { role: true } } },
    });

    const isSuperAdmin = user?.roles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      throw new ForbiddenException('Solo los Super Administradores pueden crear organizaciones');
    }

    return this.prisma.organization.create({
      data: createOrganizationDto,
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      include: {
        communities: true,
        users: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        communities: {
          include: {
            units: true,
            communityAdmins: {
              include: { user: true },
            },
          },
        },
        users: {
          include: {
            roles: { include: { role: true } },
            userUnits: {
              include: {
                unit: { include: { community: true } },
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto, updatedByUserId: string) {
    // Verificar permisos
    const user = await this.prisma.user.findUnique({
      where: { id: updatedByUserId },
      include: { roles: { include: { role: true } } },
    });

    const isSuperAdmin = user?.roles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Solo los Super Administradores pueden actualizar organizaciones',
      );
    }

    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });
  }

  async remove(id: string, deletedByUserId: string) {
    // Verificar permisos
    const user = await this.prisma.user.findUnique({
      where: { id: deletedByUserId },
      include: { roles: { include: { role: true } } },
    });

    const isSuperAdmin = user?.roles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      throw new ForbiddenException('Solo los Super Administradores pueden eliminar organizaciones');
    }

    // Verificar que no tenga comunidades activas
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: { communities: true },
    });

    if (organization?.communities.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar una organización que tiene comunidades activas',
      );
    }

    return this.prisma.organization.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async getOrganizationStats(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        communities: {
          include: {
            units: true,
            _count: {
              select: {
                units: true,
                announcements: true,
                documents: true,
              },
            },
          },
        },
        users: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (!organization) {
      throw new BadRequestException('Organización no encontrada');
    }

    const totalCommunities = organization.communities.length;
    const totalUnits = organization.communities.reduce(
      (acc, community) => acc + community.units.length,
      0,
    );
    const totalUsers = organization.users.length;

    const usersByRole = organization.users.reduce(
      (acc, user) => {
        const roleName = user.roles[0]?.role.name || 'SIN_ROL';
        acc[roleName] = (acc[roleName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        plan: organization.plan,
        isActive: organization.isActive,
      },
      stats: {
        totalCommunities,
        totalUnits,
        totalUsers,
        usersByRole,
        communities: organization.communities.map((community) => ({
          id: community.id,
          name: community.name,
          unitsCount: community._count.units,
          announcementsCount: community._count.announcements,
          documentsCount: community._count.documents,
        })),
      },
    };
  }

  async upgradePlan(organizationId: string, newPlan: PlanType, upgradedByUserId: string) {
    // Verificar permisos
    const user = await this.prisma.user.findUnique({
      where: { id: upgradedByUserId },
      include: { roles: { include: { role: true } } },
    });

    const isSuperAdmin = user?.roles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      throw new ForbiddenException('Solo los Super Administradores pueden cambiar planes');
    }

    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { plan: newPlan },
    });
  }
}
