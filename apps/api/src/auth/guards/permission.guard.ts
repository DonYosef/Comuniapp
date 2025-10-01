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

    console.log('🔒 [PermissionGuard] ===== VERIFICANDO PERMISOS =====');
    console.log('🔒 [PermissionGuard] Endpoint:', request.method, request.url);
    console.log('🔒 [PermissionGuard] Usuario:', user?.id);
    console.log('🔒 [PermissionGuard] Roles del usuario:', user?.roles);

    if (!user) {
      console.log('🔒 [PermissionGuard] ❌ Usuario no autenticado');
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener los permisos requeridos del decorador
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('🔒 [PermissionGuard] Permisos requeridos:', requiredPermissions);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      console.log('🔒 [PermissionGuard] ✅ No hay permisos requeridos, permitiendo acceso');
      return true; // Si no hay permisos requeridos, permitir acceso
    }

    // Super Admin tiene acceso total
    if (user.roles.some((role: any) => role.name === 'SUPER_ADMIN')) {
      console.log('🔒 [PermissionGuard] ✅ Usuario es SUPER_ADMIN, permitiendo acceso');
      return true;
    }

    // Normalizar permisos requeridos a minúsculas
    const requiredPermissionsLower = requiredPermissions.map((p) => String(p).toLowerCase());

    // Obtener todos los permisos del usuario (normalizados a minúsculas)
    const userPermissionsLower = new Set<string>();

    user.roles.forEach((ur: any) => {
      const permissions = ur.role?.permissions || ur.permissions || [];
      permissions.forEach((permission: string) => {
        userPermissionsLower.add(permission.toLowerCase());
      });
    });

    // Verificar si el usuario tiene al menos uno de los permisos requeridos
    const hasPermission = requiredPermissionsLower.some((permission) =>
      userPermissionsLower.has(permission),
    );

    if (!hasPermission) {
      console.log('🔍 [PermissionGuard] Permisos requeridos:', requiredPermissionsLower);
      console.log('🔍 [PermissionGuard] Permisos del usuario:', Array.from(userPermissionsLower));
      throw new ForbiddenException(
        `No tienes ninguno de los permisos requeridos: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
