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
        unit: {
          include: {
            userUnits: {
              where: { status: 'CONFIRMED' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        commonSpace: true,
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

  async updateReservationStatus(reservationId: string, status: string, requestingUserId: string) {
    const reservation = await this.prisma.spaceReservation.findUnique({
      where: { id: reservationId },
      include: {
        unit: {
          include: {
            community: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      reservation.unit.communityId,
      'manage_reservations' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para actualizar esta reserva');
    }

    // Validar que solo se permitan estados CONFIRMED o CANCELLED
    if (status !== 'CONFIRMED' && status !== 'CANCELLED') {
      throw new ForbiddenException('Solo se puede cambiar el estado a Confirmada o Cancelada');
    }

    // El conserje puede:
    // - Cambiar PENDING a CONFIRMED (confirmar solicitud del residente)
    // - Cambiar PENDING a CANCELLED (rechazar solicitud del residente)
    // - Cambiar CONFIRMED a CANCELLED (cancelar reserva confirmada)
    // - Cambiar CANCELLED a CONFIRMED (reactivar reserva cancelada)

    // Actualizar el estado de la reserva
    return this.prisma.spaceReservation.update({
      where: { id: reservationId },
      data: {
        status: status as any,
      },
      include: {
        commonSpace: true,
        unit: {
          include: {
            userUnits: {
              where: { status: 'CONFIRMED' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getCommonSpaces(communityId: string, requestingUserId: string) {
    console.log(
      `[ConciergeService] getCommonSpaces - communityId: ${communityId}, userId: ${requestingUserId}`,
    );

    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      communityId,
      'manage_reservations' as any,
    );

    if (!hasAccess) {
      console.log(
        `[ConciergeService] getCommonSpaces - Acceso denegado para userId: ${requestingUserId}`,
      );
      throw new ForbiddenException(
        'No tienes permisos para ver espacios comunes de esta comunidad',
      );
    }

    const spaces = await this.prisma.communityCommonSpace.findMany({
      where: {
        communityId: communityId,
        isActive: true,
      },
      include: {
        schedules: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    console.log(
      `[ConciergeService] getCommonSpaces - Encontrados ${spaces.length} espacios comunes`,
    );
    return spaces;
  }

  async getUnits(communityId: string, requestingUserId: string) {
    console.log(
      `[ConciergeService] getUnits - communityId: ${communityId}, userId: ${requestingUserId}`,
    );

    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      communityId,
      'manage_reservations' as any,
    );

    if (!hasAccess) {
      console.log(`[ConciergeService] getUnits - Acceso denegado para userId: ${requestingUserId}`);
      throw new ForbiddenException('No tienes permisos para ver unidades de esta comunidad');
    }

    // Obtener todas las unidades activas (el conserje puede reservar para cualquier unidad)
    const allUnits = await this.prisma.unit.findMany({
      where: {
        communityId: communityId,
        isActive: true,
      },
      include: {
        userUnits: {
          where: { status: 'CONFIRMED' }, // Solo mostrar residentes confirmados
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { number: 'asc' },
    });

    console.log(`[ConciergeService] getUnits - Total unidades activas: ${allUnits.length}`);

    // Retornar todas las unidades activas (aunque no tengan residentes confirmados)
    // Esto permite al conserje reservar para cualquier unidad
    return allUnits;
  }

  async createReservation(reservationData: any, requestingUserId: string) {
    // Verificar que el espacio común existe y está activo
    const commonSpace = await this.prisma.communityCommonSpace.findUnique({
      where: { id: reservationData.commonSpaceId },
      include: { community: true },
    });

    if (!commonSpace) {
      throw new NotFoundException('Espacio común no encontrado');
    }

    if (!commonSpace.isActive) {
      throw new ForbiddenException('El espacio común no está disponible');
    }

    // Verificar que el conserje tiene acceso a esta comunidad
    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      commonSpace.communityId,
      'manage_reservations' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para crear reservas en esta comunidad');
    }

    // Verificar que la unidad existe y pertenece a la misma comunidad
    const unit = await this.prisma.unit.findUnique({
      where: { id: reservationData.unitId },
      include: { community: true },
    });

    if (!unit) {
      throw new NotFoundException('Unidad no encontrada');
    }

    if (unit.communityId !== commonSpace.communityId) {
      throw new ForbiddenException(
        'La unidad no pertenece a la misma comunidad que el espacio común',
      );
    }

    // Verificar que no haya conflictos de horario
    const conflictingReservation = await this.prisma.spaceReservation.findFirst({
      where: {
        commonSpaceId: reservationData.commonSpaceId,
        reservationDate: new Date(reservationData.reservationDate),
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: reservationData.startTime } },
              { endTime: { gt: reservationData.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: reservationData.endTime } },
              { endTime: { gte: reservationData.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: reservationData.startTime } },
              { endTime: { lte: reservationData.endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingReservation) {
      throw new ForbiddenException('Ya existe una reserva en ese horario para este espacio común');
    }

    // Crear la reserva
    return this.prisma.spaceReservation.create({
      data: {
        commonSpaceId: reservationData.commonSpaceId,
        unitId: reservationData.unitId,
        reservationDate: new Date(reservationData.reservationDate),
        startTime: reservationData.startTime,
        endTime: reservationData.endTime,
        status: 'CONFIRMED', // El conserje crea reservas confirmadas directamente
      },
      include: {
        commonSpace: true,
        unit: {
          include: {
            community: true,
          },
        },
      },
    });
  }

  async getDebugInfo(communityId: string, requestingUserId: string) {
    console.log(
      `[ConciergeService] getDebugInfo - communityId: ${communityId}, userId: ${requestingUserId}`,
    );

    const hasAccess = await this.authorizationService.hasContextAccess(
      requestingUserId,
      communityId,
      'manage_reservations' as any,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para ver información de esta comunidad');
    }

    // Obtener información de la comunidad
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!community) {
      throw new NotFoundException('Comunidad no encontrada');
    }

    // Contar espacios comunes activos
    const commonSpacesCount = await this.prisma.communityCommonSpace.count({
      where: {
        communityId: communityId,
        isActive: true,
      },
    });

    const commonSpaces = await this.prisma.communityCommonSpace.findMany({
      where: {
        communityId: communityId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
    });

    // Contar unidades activas
    const unitsCount = await this.prisma.unit.count({
      where: {
        communityId: communityId,
        isActive: true,
      },
    });

    // Contar unidades con residentes confirmados
    const unitsWithResidentsCount = await this.prisma.unit.count({
      where: {
        communityId: communityId,
        isActive: true,
        userUnits: {
          some: {
            status: 'CONFIRMED',
          },
        },
      },
    });

    return {
      community: {
        id: community.id,
        name: community.name,
        isActive: community.isActive,
      },
      commonSpaces: {
        total: commonSpacesCount,
        list: commonSpaces,
      },
      units: {
        total: unitsCount,
        withResidents: unitsWithResidentsCount,
      },
      message:
        commonSpacesCount === 0
          ? '⚠️ No hay espacios comunes activos en esta comunidad. Usa el script "npm run check:spaces" para crear espacios de ejemplo.'
          : `✅ Hay ${commonSpacesCount} espacios comunes activos`,
    };
  }
}
