import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemMetrics() {
    const [
      totalOrganizations,
      totalCommunities,
      totalUsers,
      totalUnits,
      activeUsers,
      usersByRole,
      organizationsByPlan,
      recentActivity,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.community.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.unit.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: {
          isActive: true,
          status: 'ACTIVE',
        },
      }),
      this.getUsersByRole(),
      this.getOrganizationsByPlan(),
      this.getRecentActivity(),
    ]);

    return {
      overview: {
        totalOrganizations,
        totalCommunities,
        totalUsers,
        totalUnits,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
      usersByRole,
      organizationsByPlan,
      recentActivity,
    };
  }

  private async getUsersByRole() {
    const userRoles = await this.prisma.userRole.findMany({
      include: {
        role: true,
        user: {
          select: { isActive: true },
        },
      },
    });

    const roleCounts = userRoles.reduce(
      (acc, userRole) => {
        const roleName = userRole.role.name;
        if (!acc[roleName]) {
          acc[roleName] = { total: 0, active: 0 };
        }
        acc[roleName].total++;
        if (userRole.user.isActive) {
          acc[roleName].active++;
        }
        return acc;
      },
      {} as Record<string, { total: number; active: number }>,
    );

    return roleCounts;
  }

  private async getOrganizationsByPlan() {
    const organizations = await this.prisma.organization.findMany({
      where: { isActive: true },
      select: { plan: true },
    });

    return organizations.reduce(
      (acc, org) => {
        acc[org.plan] = (acc[org.plan] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async getRecentActivity() {
    const [recentUsers, recentCommunities, recentOrganizations] = await Promise.all([
      this.prisma.user.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          organization: {
            select: { name: true },
          },
        },
      }),
      this.prisma.community.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true,
          organization: {
            select: { name: true },
          },
        },
      }),
      this.prisma.organization.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          plan: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      recentUsers,
      recentCommunities,
      recentOrganizations,
    };
  }

  async getOrganizationDetails(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        communities: {
          include: {
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
            roles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!organization) {
      return null;
    }

    const totalCommunities = organization.communities.length;
    const totalUsers = organization.users.length;
    const totalUnits = organization.communities.reduce(
      (acc, community) => acc + community._count.units,
      0,
    );

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
        createdAt: organization.createdAt,
      },
      metrics: {
        totalCommunities,
        totalUsers,
        totalUnits,
        usersByRole,
      },
      communities: organization.communities.map((community) => ({
        id: community.id,
        name: community.name,
        address: community.address,
        unitsCount: community._count.units,
        announcementsCount: community._count.announcements,
        documentsCount: community._count.documents,
        createdAt: community.createdAt,
      })),
    };
  }

  async getSystemHealth() {
    const [dbConnection, totalOrganizations, totalUsers, recentErrors] = await Promise.all([
      this.testDatabaseConnection(),
      this.prisma.organization.count(),
      this.prisma.user.count(),
      this.getRecentErrors(),
    ]);

    return {
      status: dbConnection ? 'healthy' : 'unhealthy',
      database: {
        connected: dbConnection,
        totalOrganizations,
        totalUsers,
      },
      recentErrors,
    };
  }

  private async testDatabaseConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async getRecentErrors() {
    // En un sistema real, esto vendría de un sistema de logging
    // Por ahora retornamos un array vacío
    return [];
  }
}
