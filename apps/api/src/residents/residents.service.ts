import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';

import { AuthorizationService } from '../auth/services/authorization.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResidentsService {
  constructor(
    private prisma: PrismaService,
    private authorizationService: AuthorizationService,
  ) {}

  async getMyUnits(userId: string) {
    return this.prisma.userUnit.findMany({
      where: { userId },
      include: {
        unit: {
          include: {
            community: true,
          },
        },
      },
    });
  }

  async getMyExpenses(userId: string) {
    const userUnits = await this.prisma.userUnit.findMany({
      where: { userId, status: 'CONFIRMED' },
      select: { unitId: true },
    });

    const unitIds = userUnits.map((uu) => uu.unitId);

    return this.prisma.expense.findMany({
      where: {
        unitId: { in: unitIds },
      },
      include: {
        unit: {
          include: {
            community: true,
          },
        },
        payments: {
          where: { userId },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        expense: {
          include: {
            unit: {
              include: {
                community: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyVisitors(userId: string) {
    return this.prisma.visitor.findMany({
      where: { hostUserId: userId },
      include: {
        unit: true,
      },
      orderBy: { entryDate: 'desc' },
    });
  }

  async createVisitor(visitorData: any, userId: string) {
    // Verificar que el usuario tiene acceso a la unidad
    const userUnit = await this.prisma.userUnit.findFirst({
      where: {
        userId,
        unitId: visitorData.unitId,
        status: 'CONFIRMED',
      },
    });

    if (!userUnit) {
      throw new ForbiddenException('No tienes acceso a esta unidad');
    }

    return this.prisma.visitor.create({
      data: {
        ...visitorData,
        hostUserId: userId,
      },
    });
  }

  async getMyIncidents(userId: string) {
    return this.prisma.incident.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIncident(incidentData: any, userId: string) {
    return this.prisma.incident.create({
      data: {
        ...incidentData,
        userId,
      },
    });
  }

  async getMyReservations(userId: string) {
    const userUnits = await this.prisma.userUnit.findMany({
      where: { userId, status: 'CONFIRMED' },
      select: { unitId: true },
    });

    const unitIds = userUnits.map((uu) => uu.unitId);

    return this.prisma.spaceReservation.findMany({
      where: {
        unitId: { in: unitIds },
      },
      include: {
        unit: true,
      },
      orderBy: { reservationDate: 'desc' },
    });
  }

  async createReservation(reservationData: any, userId: string) {
    // Verificar que el usuario tiene acceso a la unidad
    const userUnit = await this.prisma.userUnit.findFirst({
      where: {
        userId,
        unitId: reservationData.unitId,
        status: 'CONFIRMED',
      },
    });

    if (!userUnit) {
      throw new ForbiddenException('No tienes acceso a esta unidad');
    }

    return this.prisma.spaceReservation.create({
      data: reservationData,
    });
  }

  async getCommunityAnnouncements(userId: string) {
    const userUnits = await this.prisma.userUnit.findMany({
      where: { userId, status: 'CONFIRMED' },
      include: {
        unit: {
          select: { communityId: true },
        },
      },
    });

    const communityIds = [...new Set(userUnits.map((uu) => uu.unit.communityId))];

    return this.prisma.announcement.findMany({
      where: {
        communityId: { in: communityIds },
        isActive: true,
      },
      include: {
        community: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }
}
