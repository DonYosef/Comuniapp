import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';

import { AuthorizationService } from '../auth/services/authorization.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConciergeService {
  constructor(
    private prisma: PrismaService,
    private authorizationService: AuthorizationService,
  ) {}

  async getVisitors(communityId: string, requestingUserId: string) {
    // Verificar que el usuario tiene permisos de conserje en esta comunidad
    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      communityId,
      'manage_visitors' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para ver visitantes de esta comunidad');
    }

    return this.prisma.visitor.findMany({
      where: {
        unit: {
          communityId: communityId,
        },
      },
      include: {
        unit: true,
        host: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getParcels(communityId: string, requestingUserId: string) {
    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      communityId,
      'manage_parcels' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para ver paquetes de esta comunidad');
    }

    return this.prisma.parcel.findMany({
      where: {
        unit: {
          communityId: communityId,
        },
      },
      include: {
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReservations(communityId: string, requestingUserId: string) {
    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      communityId,
      'manage_reservations' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para ver reservas de esta comunidad');
    }

    return this.prisma.spaceReservation.findMany({
      where: {
        unit: {
          communityId: communityId,
        },
      },
      include: {
        unit: true,
      },
      orderBy: { reservationDate: 'desc' },
    });
  }

  async getAnnouncements(communityId: string, requestingUserId: string) {
    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      communityId,
      'view_community_announcements' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para ver anuncios de esta comunidad');
    }

    return this.prisma.announcement.findMany({
      where: {
        communityId: communityId,
        isActive: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async updateVisitorStatus(visitorId: string, status: string, requestingUserId: string) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { id: visitorId },
      include: { unit: true },
    });

    if (!visitor) {
      throw new NotFoundException('Visitante no encontrado');
    }

    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      visitor.unit.communityId,
      'manage_visitors' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para actualizar este visitante');
    }

    return this.prisma.visitor.update({
      where: { id: visitorId },
      data: { status: status as any },
    });
  }

  async updateParcelStatus(parcelId: string, status: string, requestingUserId: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: { unit: true },
    });

    if (!parcel) {
      throw new NotFoundException('Paquete no encontrado');
    }

    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      parcel.unit.communityId,
      'manage_parcels' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para actualizar este paquete');
    }

    return this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        status: status as any,
        retrievedAt: status === 'RETRIEVED' ? new Date() : null,
      },
    });
  }
}
