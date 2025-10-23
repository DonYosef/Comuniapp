import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AnnouncementType } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, userId: string) {
    const { communityId, title, content, type = AnnouncementType.GENERAL } = createAnnouncementDto;

    // Verificar que el usuario es admin de la comunidad
    await this.verifyCommunityAdminAccess(userId, communityId);

    return this.prisma.announcement.create({
      data: {
        communityId,
        createdById: userId,
        title,
        content,
        type,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAllByCommunity(communityId: string, userId: string) {
    // Verificar que el usuario es admin de la comunidad
    await this.verifyCommunityAdminAccess(userId, communityId);

    return this.prisma.announcement.findMany({
      where: {
        communityId,
        isActive: true,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  }

  async findAllByUser(userId: string) {
    // Obtener todas las comunidades donde el usuario es admin
    const userCommunities = await this.prisma.communityAdmin.findMany({
      where: {
        userId,
      },
      select: {
        communityId: true,
      },
    });

    const communityIds = userCommunities.map((uc) => uc.communityId);

    if (communityIds.length === 0) {
      return [];
    }

    return this.prisma.announcement.findMany({
      where: {
        communityId: {
          in: communityIds,
        },
        isActive: true,
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Aviso no encontrado');
    }

    // Verificar que el usuario es admin de la comunidad
    await this.verifyCommunityAdminAccess(userId, announcement.communityId);

    return announcement;
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto, userId: string) {
    const announcement = await this.findOne(id, userId);

    return this.prisma.announcement.update({
      where: { id },
      data: updateAnnouncementDto,
      include: {
        community: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const announcement = await this.findOne(id, userId);

    // Soft delete - marcar como inactivo
    return this.prisma.announcement.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async verifyCommunityAdminAccess(userId: string, communityId: string) {
    // Verificar que el usuario es admin de la comunidad
    const isAdmin = await this.prisma.communityAdmin.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });

    if (!isAdmin) {
      // Verificar si es super admin
      const userRoles = await this.prisma.userRole.findMany({
        where: {
          userId,
          role: {
            name: 'SUPER_ADMIN',
          },
        },
      });

      if (userRoles.length === 0) {
        throw new ForbiddenException('No tienes permisos para gestionar avisos de esta comunidad');
      }
    }
  }
}
