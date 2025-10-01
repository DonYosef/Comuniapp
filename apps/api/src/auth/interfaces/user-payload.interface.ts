import { Role } from '@prisma/client';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  roles: Role[];
  userUnits: any[];
}
