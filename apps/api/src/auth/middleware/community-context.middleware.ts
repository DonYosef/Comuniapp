import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunityContextMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (!user) {
      return next();
    }

    // Solo aplicar a Community Admins
    const isCommunityAdmin = user.roles?.some((role: any) => role.name === 'COMMUNITY_ADMIN');

    if (!isCommunityAdmin) {
      return next();
    }

    // Obtener comunidades del usuario
    const userCommunities = await this.prisma.communityAdmin.findMany({
      where: { userId: user.id },
      include: { community: true },
    });

    if (userCommunities.length === 0) {
      throw new ForbiddenException('No tienes comunidades asignadas');
    }

    // Si solo tiene una comunidad, establecerla por defecto
    if (userCommunities.length === 1) {
      (req as any).communityContext = userCommunities[0].community;
      return next();
    }

    // Si tiene múltiples comunidades, verificar si se especificó una
    const communityId =
      (req.headers['x-community-id'] as string) || (req.query.communityId as string);

    if (communityId) {
      const community = userCommunities.find((uc) => uc.communityId === communityId);

      if (!community) {
        throw new ForbiddenException('No tienes acceso a esta comunidad');
      }

      (req as any).communityContext = community.community;
    } else {
      // Si no se especificó comunidad, incluir todas las disponibles
      (req as any).availableCommunities = userCommunities.map((uc) => uc.community);
    }

    next();
  }
}
