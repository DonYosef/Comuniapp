import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CommunityAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('🔒 [CommunityAdminGuard] Verificando acceso para usuario:', user?.id);
    console.log('🔒 [CommunityAdminGuard] Roles del usuario:', user?.roles);

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el usuario tiene rol COMMUNITY_ADMIN
    const isCommunityAdmin = user.roles?.some((role: any) => role.name === 'COMMUNITY_ADMIN');
    const isSuperAdmin = user.roles?.some((role: any) => role.name === 'SUPER_ADMIN');

    if (isSuperAdmin || isCommunityAdmin) {
      console.log(
        '🔒 [CommunityAdminGuard] ✅ Usuario tiene acceso (SUPER_ADMIN o COMMUNITY_ADMIN)',
      );
      return true;
    }

    console.log('🔒 [CommunityAdminGuard] ❌ Usuario no tiene acceso');
    throw new ForbiddenException('Solo administradores de comunidad pueden acceder a este recurso');
  }
}
