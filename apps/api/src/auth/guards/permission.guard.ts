import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Permission } from '../../domain/entities/role.entity';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { AuthorizationService } from '../services/authorization.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener el permiso requerido del decorador
    const requiredPermission = this.reflector.getAllAndOverride<Permission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true; // Si no hay permiso requerido, permitir acceso
    }

    // Super Admin tiene acceso total
    if (user.roles.some((role: any) => role.name === 'SUPER_ADMIN')) {
      return true;
    }

    // Verificar si el usuario tiene el permiso requerido
    const hasPermission = user.roles.some(
      (ur: any) => ur.role.permissions && ur.role.permissions.includes(requiredPermission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(`No tienes el permiso requerido: ${requiredPermission}`);
    }

    return true;
  }
}
