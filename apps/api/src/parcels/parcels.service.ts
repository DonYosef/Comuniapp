import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthorizationService } from '../auth/services/authorization.service';
import { Permission } from '../domain/entities/role.entity';
import { ParcelStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';

@Injectable()
export class ParcelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(createParcelDto: CreateParcelDto, userId: string) {
    // Verificar que la unidad existe y el usuario tiene acceso
    const unit = await this.prisma.unit.findUnique({
      where: { id: createParcelDto.unitId },
      include: {
        community: true,
        userUnits: {
          include: { user: true },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unidad no encontrada');
    }

    // Verificar permisos del usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    const isAdmin = user?.roles.some(
      (role) => role.role.name === 'SUPER_ADMIN' || role.role.name === 'COMMUNITY_ADMIN',
    );

    const isResident = user?.roles.some((role) => role.role.name === 'RESIDENT');
    const isConcierge = user?.roles.some((role) => role.role.name === 'CONCIERGE');
    const hasAccessToUnit = unit.userUnits.some((userUnit) => userUnit.userId === userId);

    if (!isAdmin && !(isResident && hasAccessToUnit)) {
      if (isConcierge) {
        const canConcierge = await this.authorizationService.hasContextAccess(
          userId,
          unit.communityId,
          Permission.MANAGE_PARCELS as any,
        );
        if (!canConcierge) {
          throw new ForbiddenException('No tienes permisos para crear encomiendas en esta unidad');
        }
      } else {
        throw new ForbiddenException('No tienes permisos para crear encomiendas en esta unidad');
      }
    }

    const parcel = await this.prisma.parcel.create({
      data: {
        unitId: createParcelDto.unitId,
        description: createParcelDto.description,
        sender: createParcelDto.sender,
        senderPhone: (createParcelDto as any).senderPhone,
        recipientName: (createParcelDto as any).recipientName,
        recipientResidence: (createParcelDto as any).recipientResidence,
        recipientPhone: (createParcelDto as any).recipientPhone,
        recipientEmail: (createParcelDto as any).recipientEmail,
        conciergeName: (createParcelDto as any).conciergeName,
        conciergePhone: (createParcelDto as any).conciergePhone,
        notes: (createParcelDto as any).notes,
        receivedAt: createParcelDto.receivedAt ? new Date(createParcelDto.receivedAt) : new Date(),
        status: createParcelDto.status,
      },
      include: {
        unit: {
          include: {
            community: true,
            userUnits: {
              include: { user: true },
            },
          },
        },
      },
    });

    return this.formatParcelResponse(parcel);
  }

  async findAll(userId: string, unitId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    const isAdmin = user?.roles.some(
      (role) => role.role.name === 'SUPER_ADMIN' || role.role.name === 'COMMUNITY_ADMIN',
    );

    const isResident = user?.roles.some((role) => role.role.name === 'RESIDENT');
    const isConcierge = user?.roles.some((role) => role.role.name === 'CONCIERGE');

    const whereClause: any = {};

    // Si es residente, solo puede ver encomiendas de sus unidades
    if (isResident && !isAdmin) {
      const userUnits = await this.prisma.userUnit.findMany({
        where: { userId },
        select: { unitId: true },
      });

      whereClause.unitId = {
        in: userUnits.map((uu) => uu.unitId),
      };
    }

    // Si se especifica unitId, filtrar por esa unidad
    if (unitId) {
      whereClause.unitId = unitId;
    }

    const parcels = await this.prisma.parcel.findMany({
      where: whereClause,
      include: {
        unit: {
          include: {
            community: true,
            userUnits: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return parcels.map((parcel) => this.formatParcelResponse(parcel));
  }

  async findOne(id: string, userId: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            community: true,
            userUnits: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!parcel) {
      throw new NotFoundException('Encomienda no encontrada');
    }

    // Verificar permisos
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    const isAdmin = user?.roles.some(
      (role) => role.role.name === 'SUPER_ADMIN' || role.role.name === 'COMMUNITY_ADMIN',
    );

    const isResident = user?.roles.some((role) => role.role.name === 'RESIDENT');
    const isConcierge = user?.roles.some((role) => role.role.name === 'CONCIERGE');
    const hasAccessToUnit = parcel.unit.userUnits.some((userUnit) => userUnit.userId === userId);

    if (!isAdmin && !(isResident && hasAccessToUnit)) {
      if (isConcierge) {
        const canConcierge = await this.authorizationService.hasContextAccess(
          userId,
          parcel.unit.communityId,
          Permission.MANAGE_PARCELS as any,
        );
        if (!canConcierge) {
          throw new ForbiddenException('No tienes permisos para ver esta encomienda');
        }
      } else {
        throw new ForbiddenException('No tienes permisos para ver esta encomienda');
      }
    }

    return this.formatParcelResponse(parcel);
  }

  async update(id: string, updateParcelDto: UpdateParcelDto, userId: string) {
    const parcel = await this.findOne(id, userId);

    const updatedParcel = await this.prisma.parcel.update({
      where: { id },
      data: {
        // Solo campos existentes en el modelo Prisma
        description: updateParcelDto.description,
        sender: updateParcelDto.sender,
        senderPhone: (updateParcelDto as any).senderPhone,
        recipientName: (updateParcelDto as any).recipientName,
        recipientResidence: (updateParcelDto as any).recipientResidence,
        recipientPhone: (updateParcelDto as any).recipientPhone,
        recipientEmail: (updateParcelDto as any).recipientEmail,
        conciergeName: (updateParcelDto as any).conciergeName,
        conciergePhone: (updateParcelDto as any).conciergePhone,
        notes: (updateParcelDto as any).notes,
        receivedAt: updateParcelDto.receivedAt ? new Date(updateParcelDto.receivedAt) : undefined,
        status: updateParcelDto.status,
      },
      include: {
        unit: {
          include: {
            community: true,
            userUnits: {
              include: { user: true },
            },
          },
        },
      },
    });

    return this.formatParcelResponse(updatedParcel);
  }

  async markAsRetrieved(id: string, userId: string) {
    const parcel = await this.findOne(id, userId);

    const updatedParcel = await this.prisma.parcel.update({
      where: { id },
      data: {
        status: ParcelStatus.RETRIEVED,
        retrievedAt: new Date(),
      },
      include: {
        unit: {
          include: {
            community: true,
            userUnits: {
              include: { user: true },
            },
          },
        },
      },
    });

    return this.formatParcelResponse(updatedParcel);
  }

  async remove(id: string, userId: string) {
    const parcel = await this.findOne(id, userId);

    await this.prisma.parcel.delete({
      where: { id },
    });

    return { message: 'Encomienda eliminada exitosamente' };
  }

  private formatParcelResponse(parcel: any) {
    return {
      id: parcel.id,
      unitId: parcel.unitId,
      unitNumber: parcel.unit.number,
      communityName: parcel.unit.community.name,
      description: parcel.description,
      sender: parcel.sender,
      senderPhone: parcel.senderPhone,
      // Fallbacks: como estos campos no existen en BD, derivamos valores útiles para la UI
      recipientName:
        parcel.recipientName ||
        (parcel.unit.userUnits && parcel.unit.userUnits[0]
          ? parcel.unit.userUnits[0].user.name
          : undefined),
      recipientResidence: parcel.recipientResidence || parcel.unit.number,
      recipientPhone: parcel.recipientPhone,
      recipientEmail: parcel.recipientEmail,
      conciergeName: parcel.conciergeName,
      conciergePhone: parcel.conciergePhone,
      notes: parcel.notes,
      receivedAt: parcel.receivedAt,
      retrievedAt: parcel.retrievedAt,
      status: parcel.status,
      createdAt: parcel.createdAt,
      updatedAt: parcel.updatedAt,
      residents: parcel.unit.userUnits.map((uu: any) => ({
        id: uu.user.id,
        name: uu.user.name,
        email: uu.user.email,
        phone: uu.user.phone,
        status: uu.status,
      })),
    };
  }
}
