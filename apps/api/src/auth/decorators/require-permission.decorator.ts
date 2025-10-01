import { SetMetadata } from '@nestjs/common';

import { Permission } from '../../domain/entities/role.entity';

export const PERMISSION_KEY = 'permission';

export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
