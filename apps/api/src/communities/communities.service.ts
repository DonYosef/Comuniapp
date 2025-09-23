import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommunityDto,
  CreateCommonSpaceDto,
  CommunityType,
} from './dto/create-community.dto';
import { UnitType } from '@prisma/client';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async createCommunity(createCommunityDto: CreateCommunityDto, userId: string) {
    // Verificar que el usuario existe y obtener su organización
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.organizationId) {
      throw new ForbiddenException('El usuario debe estar asociado a una organización');
    }

    // Crear la comunidad
    const community = await this.prisma.community.create({
      data: {
        name: createCommunityDto.name,
        description: createCommunityDto.description,
        address: createCommunityDto.address,
        phone: createCommunityDto.phone,
        email: createCommunityDto.email,
        website: createCommunityDto.website,
        type: createCommunityDto.type,
        totalUnits: createCommunityDto.totalUnits,
        constructionYear: createCommunityDto.constructionYear,
        floors: createCommunityDto.floors,
        unitsPerFloor: createCommunityDto.unitsPerFloor,
        buildingStructure: createCommunityDto.buildingStructure,
        imageUrl: createCommunityDto.imageUrl,
        organizationId: user.organizationId,
        createdById: userId,
      },
    });

    // Crear las unidades según el tipo de comunidad
    await this.createUnits(community.id, createCommunityDto);

    // Crear los espacios comunes si se proporcionan
    if (createCommunityDto.commonSpaces && createCommunityDto.commonSpaces.length > 0) {
      await this.createCommonSpaces(community.id, createCommunityDto.commonSpaces);
    }

    // Crear la relación de administrador
    await this.prisma.communityAdmin.create({
      data: {
        communityId: community.id,
        userId: userId,
      },
    });

    return community;
  }

  private async createUnits(communityId: string, dto: CreateCommunityDto) {
    const units = [];

    if (dto.type === CommunityType.EDIFICIO && dto.buildingStructure) {
      // Para edificios, usar la estructura definida
      for (const [floor, unitNumbers] of Object.entries(dto.buildingStructure)) {
        for (const unitNumber of unitNumbers) {
          units.push({
            number: unitNumber,
            floor: floor,
            type: 'APARTMENT',
            communityId: communityId,
          });
        }
      }
    } else {
      // Para condominios o edificios sin estructura específica
      for (let i = 1; i <= dto.totalUnits; i++) {
        units.push({
          number: i.toString().padStart(3, '0'),
          type: dto.type === CommunityType.CONDOMINIO ? UnitType.HOUSE : UnitType.APARTMENT,
          communityId: communityId,
        });
      }
    }

    // Crear todas las unidades
    await this.prisma.unit.createMany({
      data: units,
    });
  }

  private async createCommonSpaces(communityId: string, commonSpaces: CreateCommonSpaceDto[]) {
    const spaces = commonSpaces.map((space) => ({
      name: space.name,
      quantity: space.quantity,
      description: space.description,
      communityId: communityId,
    }));

    await this.prisma.communityCommonSpace.createMany({
      data: spaces,
    });
  }

  async getCommunitiesByUser(userId: string) {
    // Obtener comunidades donde el usuario es administrador
    const communityAdmins = await this.prisma.communityAdmin.findMany({
      where: { userId },
      include: {
        community: {
          include: {
            organization: true,
            commonSpaces: true,
            _count: {
              select: {
                units: true,
              },
            },
          },
        },
      },
    });

    return communityAdmins.map((ca) => ca.community);
  }

  async getCommunityById(id: string, userId: string) {
    // Verificar que el usuario es administrador de la comunidad
    const communityAdmin = await this.prisma.communityAdmin.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: userId,
        },
      },
      include: {
        community: {
          include: {
            organization: true,
            units: true,
            commonSpaces: true,
          },
        },
      },
    });

    if (!communityAdmin) {
      throw new NotFoundException('Comunidad no encontrada o no tienes permisos para acceder');
    }

    return communityAdmin.community;
  }

  async updateCommunity(id: string, updateData: Partial<CreateCommunityDto>, userId: string) {
    // Verificar que el usuario es administrador de la comunidad
    const communityAdmin = await this.prisma.communityAdmin.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: userId,
        },
      },
    });

    if (!communityAdmin) {
      throw new NotFoundException('Comunidad no encontrada o no tienes permisos para modificar');
    }

    return this.prisma.community.update({
      where: { id },
      data: {
        name: updateData.name,
        description: updateData.description,
        address: updateData.address,
        phone: updateData.phone,
        email: updateData.email,
        website: updateData.website,
        type: updateData.type,
        totalUnits: updateData.totalUnits,
        constructionYear: updateData.constructionYear,
        floors: updateData.floors,
        unitsPerFloor: updateData.unitsPerFloor,
        buildingStructure: updateData.buildingStructure,
        imageUrl: updateData.imageUrl,
      },
    });
  }

  async deleteCommunity(id: string, userId: string) {
    // Verificar que el usuario es administrador de la comunidad
    const communityAdmin = await this.prisma.communityAdmin.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: userId,
        },
      },
    });

    if (!communityAdmin) {
      throw new NotFoundException('Comunidad no encontrada o no tienes permisos para eliminar');
    }

    // Soft delete
    return this.prisma.community.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // Métodos para gestión de espacios comunes
  async addCommonSpace(communityId: string, spaceData: CreateCommonSpaceDto, userId: string) {
    // Verificar que el usuario es administrador de la comunidad
    const communityAdmin = await this.prisma.communityAdmin.findUnique({
      where: {
        communityId_userId: {
          communityId: communityId,
          userId: userId,
        },
      },
    });

    if (!communityAdmin) {
      throw new NotFoundException('No tienes permisos para modificar esta comunidad');
    }

    return this.prisma.communityCommonSpace.create({
      data: {
        name: spaceData.name,
        quantity: spaceData.quantity,
        description: spaceData.description,
        communityId: communityId,
      },
    });
  }

  async removeCommonSpace(spaceId: string, userId: string) {
    // Verificar que el usuario es administrador de la comunidad del espacio
    const space = await this.prisma.communityCommonSpace.findUnique({
      where: { id: spaceId },
      include: {
        community: {
          include: {
            communityAdmins: {
              where: { userId: userId },
            },
          },
        },
      },
    });

    if (!space || space.community.communityAdmins.length === 0) {
      throw new NotFoundException('No tienes permisos para eliminar este espacio');
    }

    return this.prisma.communityCommonSpace.update({
      where: { id: spaceId },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  // Métodos para gestión de unidades
  async getCommunityUnits(communityId: string, userId: string) {
    // Verificar que el usuario es administrador de la comunidad
    const communityAdmin = await this.prisma.communityAdmin.findUnique({
      where: {
        communityId_userId: {
          communityId: communityId,
          userId: userId,
        },
      },
    });

    if (!communityAdmin) {
      throw new NotFoundException('No tienes permisos para acceder a esta comunidad');
    }

    return this.prisma.unit.findMany({
      where: {
        communityId: communityId,
        isActive: true,
      },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    });
  }

  async addUnit(
    communityId: string,
    unitData: { number: string; floor?: string; type?: string },
    userId: string,
  ) {
    // Verificar que el usuario es administrador de la comunidad
    const communityAdmin = await this.prisma.communityAdmin.findUnique({
      where: {
        communityId_userId: {
          communityId: communityId,
          userId: userId,
        },
      },
    });

    if (!communityAdmin) {
      throw new NotFoundException('No tienes permisos para modificar esta comunidad');
    }

    return this.prisma.unit.create({
      data: {
        number: unitData.number,
        floor: unitData.floor,
        type: (unitData.type as UnitType) || UnitType.APARTMENT,
        communityId: communityId,
      },
    });
  }

  async removeUnit(unitId: string, userId: string) {
    // Verificar que el usuario es administrador de la comunidad de la unidad
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        community: {
          include: {
            communityAdmins: {
              where: { userId: userId },
            },
          },
        },
      },
    });

    if (!unit || unit.community.communityAdmins.length === 0) {
      throw new NotFoundException('No tienes permisos para eliminar esta unidad');
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
