import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { VisitorStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Injectable()
export class VisitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVisitorDto: CreateVisitorDto, userId: string) {
    // Verificar que la unidad existe y el usuario tiene acceso
    const unit = await this.prisma.unit.findUnique({
      where: { id: createVisitorDto.unitId },
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
      throw new ForbiddenException('No tienes permisos para crear visitas en esta unidad');
    }

    const visitor = await this.prisma.visitor.create({
      data: {
        ...createVisitorDto,
        expectedArrival: new Date(createVisitorDto.expectedArrival),
        expectedDeparture: new Date(createVisitorDto.expectedDeparture),
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
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.formatVisitorResponse(visitor);
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

    const whereClause: any = {};

    // Si es residente, solo puede ver visitas de sus unidades
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

    const visitors = await this.prisma.visitor.findMany({
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
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return visitors.map((visitor) => this.formatVisitorResponse(visitor));
  }

  async findOne(id: string, userId: string) {
    const visitor = await this.prisma.visitor.findUnique({
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
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!visitor) {
      throw new NotFoundException('Visita no encontrada');
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
    const hasAccessToUnit = visitor.unit.userUnits.some((userUnit) => userUnit.userId === userId);

    if (!isAdmin && !(isResident && hasAccessToUnit)) {
      throw new ForbiddenException('No tienes permisos para ver esta visita');
    }

    return this.formatVisitorResponse(visitor);
  }

  async update(id: string, updateVisitorDto: UpdateVisitorDto, userId: string) {
    const visitor = await this.findOne(id, userId);

    const updatedVisitor = await this.prisma.visitor.update({
      where: { id },
      data: {
        ...updateVisitorDto,
        expectedArrival: updateVisitorDto.expectedArrival
          ? new Date(updateVisitorDto.expectedArrival)
          : undefined,
        expectedDeparture: updateVisitorDto.expectedDeparture
          ? new Date(updateVisitorDto.expectedDeparture)
          : undefined,
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
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.formatVisitorResponse(updatedVisitor);
  }

  async markAsArrived(id: string, userId: string) {
    const visitor = await this.findOne(id, userId);

    const updatedVisitor = await this.prisma.visitor.update({
      where: { id },
      data: {
        status: VisitorStatus.ENTERED,
        entryDate: new Date(),
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
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.formatVisitorResponse(updatedVisitor);
  }

  async markAsCompleted(id: string, userId: string) {
    const visitor = await this.findOne(id, userId);

    const updatedVisitor = await this.prisma.visitor.update({
      where: { id },
      data: {
        status: VisitorStatus.EXITED,
        exitDate: new Date(),
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
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.formatVisitorResponse(updatedVisitor);
  }

  async remove(id: string, userId: string) {
    const visitor = await this.findOne(id, userId);

    await this.prisma.visitor.delete({
      where: { id },
    });

    return { message: 'Visita eliminada exitosamente' };
  }

  private formatVisitorResponse(visitor: any) {
    return {
      id: visitor.id,
      unitId: visitor.unitId,
      unitNumber: visitor.unit.number,
      communityName: visitor.unit.community.name,
      hostUserId: visitor.hostUserId,
      hostName: visitor.host.name,
      hostEmail: visitor.host.email,
      hostPhone: visitor.host.phone,
      visitorName: visitor.visitorName,
      visitorDocument: visitor.visitorDocument,
      visitorPhone: visitor.visitorPhone,
      visitorEmail: visitor.visitorEmail,
      residentName: visitor.residentName,
      residentPhone: visitor.residentPhone,
      visitPurpose: visitor.visitPurpose,
      expectedArrival: visitor.expectedArrival,
      expectedDeparture: visitor.expectedDeparture,
      vehicleInfo: visitor.vehicleInfo,
      notes: visitor.notes,
      entryDate: visitor.entryDate,
      exitDate: visitor.exitDate,
      status: visitor.status,
      createdAt: visitor.createdAt,
      updatedAt: visitor.updatedAt,
      residents: visitor.unit.userUnits.map((uu: any) => ({
        id: uu.user.id,
        name: uu.user.name,
        email: uu.user.email,
        phone: uu.user.phone,
        status: uu.status,
      })),
    };
  }
}
