import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UnitType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import {
  CreateCommunityDto,
  CreateCommonSpaceDto,
  CommunityType,
} from './dto/create-community.dto';

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
            coefficient: 1.0, // Valor por defecto
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
          coefficient: 1.0, // Valor por defecto
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
    console.log('🔍 [CommunitiesService] getCommunitiesByUser - userId:', userId);

    // Obtener el usuario con sus roles para determinar qué comunidades puede ver
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      console.log('❌ [CommunitiesService] Usuario no encontrado');
      return [];
    }

    const isSuperAdmin = user.roles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    const isCommunityAdmin = user.roles.some((ur) => ur.role.name === 'COMMUNITY_ADMIN');

    console.log('🔍 [CommunitiesService] Análisis de roles:');
    console.log('   - isSuperAdmin:', isSuperAdmin);
    console.log('   - isCommunityAdmin:', isCommunityAdmin);

    let communities = [];

    if (isSuperAdmin) {
      console.log('🔍 [CommunitiesService] Usuario es SUPER_ADMIN - viendo todas las comunidades');

      // SUPER_ADMIN puede ver todas las comunidades
      communities = await this.prisma.community.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          organization: true,
          commonSpaces: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              units: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (isCommunityAdmin) {
      console.log(
        '🔍 [CommunitiesService] Usuario es COMMUNITY_ADMIN - viendo comunidades creadas y donde es admin',
      );

      // COMMUNITY_ADMIN puede ver:
      // 1. Comunidades que creó
      // 2. Comunidades donde es administrador

      const [createdCommunities, adminCommunities] = await Promise.all([
        // Comunidades creadas por el usuario
        this.prisma.community.findMany({
          where: {
            createdById: userId,
            isActive: true,
            deletedAt: null,
          },
          include: {
            organization: true,
            commonSpaces: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                units: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),

        // Comunidades donde el usuario es administrador
        this.prisma.communityAdmin.findMany({
          where: { userId },
          include: {
            community: {
              include: {
                organization: true,
                commonSpaces: true,
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                _count: {
                  select: {
                    units: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      // Combinar y eliminar duplicados
      const createdCommIds = createdCommunities.map((c) => c.id);
      const adminCommIds = adminCommunities.map((ca) => ca.community.id);
      const uniqueCommIds = [...new Set([...createdCommIds, ...adminCommIds])];

      communities = [
        ...createdCommunities,
        ...adminCommunities.map((ca) => ca.community).filter((c) => !createdCommIds.includes(c.id)),
      ];

      console.log(`🔍 [CommunitiesService] Comunidades creadas: ${createdCommunities.length}`);
      console.log(`🔍 [CommunitiesService] Comunidades como admin: ${adminCommunities.length}`);
      console.log(`🔍 [CommunitiesService] Total únicas: ${communities.length}`);
    } else {
      console.log(
        '🔍 [CommunitiesService] Usuario no es SUPER_ADMIN ni COMMUNITY_ADMIN - sin acceso',
      );
      communities = [];
    }

    console.log(`✅ [CommunitiesService] Devolviendo ${communities.length} comunidades`);
    return communities;
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
    console.log('🔧 [SERVICE] deleteCommunity iniciado:', {
      communityId: id,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Verificar que el usuario es administrador de la comunidad
    console.log('🔍 [SERVICE] Verificando permisos de administrador...');
    const communityAdmin = await this.prisma.communityAdmin.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: userId,
        },
      },
    });

    console.log('👤 [SERVICE] Resultado de verificación de permisos:', {
      found: !!communityAdmin,
      communityAdminId: communityAdmin?.id,
      communityId: communityAdmin?.communityId,
      userId: communityAdmin?.userId,
    });

    if (!communityAdmin) {
      console.error('❌ [SERVICE] Usuario no tiene permisos para eliminar la comunidad');
      throw new NotFoundException('Comunidad no encontrada o no tienes permisos para eliminar');
    }

    // Verificar el estado actual de la comunidad antes de eliminar
    console.log('🔍 [SERVICE] Verificando estado actual de la comunidad...');
    const currentCommunity = await this.prisma.community.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('📊 [SERVICE] Estado actual de la comunidad:', currentCommunity);

    if (!currentCommunity) {
      console.error('❌ [SERVICE] Comunidad no encontrada en la base de datos');
      throw new NotFoundException('Comunidad no encontrada');
    }

    if (!currentCommunity.isActive) {
      console.warn('⚠️ [SERVICE] La comunidad ya está marcada como inactiva');
    }

    // Soft delete
    console.log('🗑️ [SERVICE] Ejecutando soft delete...');
    const result = await this.prisma.community.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    console.log('✅ [SERVICE] Soft delete completado:', {
      communityId: result.id,
      isActive: result.isActive,
      deletedAt: result.deletedAt,
      updatedAt: result.updatedAt,
    });

    return result;
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
