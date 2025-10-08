import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { ParcelStatus } from '@prisma/client';

@Injectable()
export class ParcelsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const hasAccessToUnit = unit.userUnits.some((userUnit) => userUnit.userId === userId);

    if (!isAdmin && !(isResident && hasAccessToUnit)) {
      throw new ForbiddenException('No tienes permisos para crear encomiendas en esta unidad');
    }

    const parcel = await this.prisma.parcel.create({
      data: {
        ...createParcelDto,
        receivedAt: createParcelDto.receivedAt ? new Date(createParcelDto.receivedAt) : new Date(),
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

    let whereClause: any = {};

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
    const hasAccessToUnit = parcel.unit.userUnits.some((userUnit) => userUnit.userId === userId);

    if (!isAdmin && !(isResident && hasAccessToUnit)) {
      throw new ForbiddenException('No tienes permisos para ver esta encomienda');
    }

    return this.formatParcelResponse(parcel);
  }

  async update(id: string, updateParcelDto: UpdateParcelDto, userId: string) {
    const parcel = await this.findOne(id, userId);

    const updatedParcel = await this.prisma.parcel.update({
      where: { id },
      data: {
        ...updateParcelDto,
        receivedAt: updateParcelDto.receivedAt ? new Date(updateParcelDto.receivedAt) : undefined,
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
      recipientName: parcel.recipientName,
      recipientResidence: parcel.recipientResidence,
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
