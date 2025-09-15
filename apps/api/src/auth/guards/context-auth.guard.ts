import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthorizationService } from '../services/authorization.service';
import { Permission } from '../../domain/entities/role.entity';

@Injectable()
export class ContextAuthGuard implements CanActivate {
  constructor(private authorizationService: AuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Super Admin tiene acceso total
    if (user.roles.some((role: any) => role.name === 'SUPER_ADMIN')) {
      return true;
    }

    // Obtener el contexto (communityId, unitId, etc.)
    const contextId = this.extractContextId(request);
    const permission = this.extractPermission(request);

    if (!contextId || !permission) {
      return true; // Si no hay contexto específico, permitir acceso
    }

    const hasAccess = await this.authorizationService.hasContextAccess(
      user.id,
      contextId,
      permission,
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    return true;
  }

  private extractContextId(request: any): string | null {
    return (
      request.params.communityId ||
      request.params.unitId ||
      request.body.communityId ||
      request.body.unitId ||
      null
    );
  }

  private extractPermission(request: any): Permission | null {
    // Esta lógica se puede mejorar con metadata del endpoint
    const method = request.method;
    const path = request.route?.path;

    if (path?.includes('users') && method === 'GET') {
      return Permission.MANAGE_COMMUNITY_USERS;
    }

    if (path?.includes('communities') && method === 'POST') {
      return Permission.MANAGE_COMMUNITY;
    }

    return null;
  }
}
