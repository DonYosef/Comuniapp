import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUnitsByCommunity(communityId: string) {
    const units = await this.prisma.unit.findMany({
      where: {
        communityId,
        isActive: true,
      },
      include: {
        community: true,
        userUnits: {
          where: { status: 'CONFIRMED' },
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

    return units.map((unit) => ({
      id: unit.id,
      number: unit.number,
      floor: unit.floor,
      type: unit.type,
      communityName: unit.community.name,
      residents: unit.userUnits.map((uu) => ({
        id: uu.user.id,
        name: uu.user.name,
        email: uu.user.email,
        phone: uu.user.phone,
        status: uu.status,
      })),
    }));
  }

  async getUnitsByUser(userId: string) {
    const userUnits = await this.prisma.userUnit.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
      },
      include: {
        unit: {
          include: {
            community: true,
            userUnits: {
              where: { status: 'CONFIRMED' },
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
        },
      },
    });

    return userUnits.map((uu) => ({
      id: uu.unit.id,
      number: uu.unit.number,
      floor: uu.unit.floor,
      type: uu.unit.type,
      communityName: uu.unit.community.name,
      residents: uu.unit.userUnits.map((uu2) => ({
        id: uu2.user.id,
        name: uu2.user.name,
        email: uu2.user.email,
        phone: uu2.user.phone,
        status: uu2.status,
      })),
    }));
  }

  async getUnitsForUser(userId: string) {
    // Cargar roles y comunidades asociadas (communityAdmins) del usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        communityAdmins: true,
      },
    });

    if (!user) return [];

    const isConcierge = user.roles.some((ur: any) => ur.role.name === 'CONCIERGE');

    // Si es conserje, traer unidades por las comunidades donde está asociado
    if (isConcierge) {
      const communityIds = user.communityAdmins.map((ca) => ca.communityId);
      if (communityIds.length === 0) return [];

      const units = await this.prisma.unit.findMany({
        where: {
          communityId: { in: communityIds },
          isActive: true,
        },
        include: {
          community: true,
          userUnits: {
            where: { status: 'CONFIRMED' },
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true },
              },
            },
          },
        },
        orderBy: { number: 'asc' },
      });

      return units.map((unit) => ({
        id: unit.id,
        number: unit.number,
        floor: unit.floor,
        type: unit.type,
        communityName: unit.community.name,
        residents: unit.userUnits.map((uu) => ({
          id: uu.user.id,
          name: uu.user.name,
          email: uu.user.email,
          phone: uu.user.phone,
          status: uu.status,
        })),
      }));
    }

    // Caso contrario, usar las unidades del usuario (residentes/admin con unidades)
    return this.getUnitsByUser(userId);
  }
}
