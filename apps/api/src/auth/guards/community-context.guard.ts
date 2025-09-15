import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CommunityContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Solo aplicar a Community Admins
    const isCommunityAdmin = user.roles?.some((role: any) => role.name === 'COMMUNITY_ADMIN');

    if (!isCommunityAdmin) {
      return true; // No es Community Admin, permitir acceso
    }

    // Verificar que tiene contexto de comunidad
    const communityContext = request.communityContext;
    const availableCommunities = request.availableCommunities;

    if (!communityContext && (!availableCommunities || availableCommunities.length === 0)) {
      throw new ForbiddenException('No tienes comunidades asignadas');
    }

    return true;
  }
}
