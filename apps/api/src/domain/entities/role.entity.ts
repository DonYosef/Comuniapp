export class Role {
  constructor(
    public readonly id: string,
    public readonly name: RoleName,
    public readonly description: string | null,
    public readonly permissions: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(name: RoleName, description: string | null, permissions: string[]): Role {
    const now = new Date();
    return new Role(
      '', // ID será generado por la base de datos
      name,
      description,
      permissions,
      now,
      now,
    );
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  isSuperAdmin(): boolean {
    return this.name === RoleName.SUPER_ADMIN;
  }

  isCommunityAdmin(): boolean {
    return this.name === RoleName.COMMUNITY_ADMIN;
  }

  isConcierge(): boolean {
    return this.name === RoleName.CONCIERGE;
  }

  isResident(): boolean {
    return this.name === RoleName.RESIDENT;
  }

  isOwner(): boolean {
    return this.name === RoleName.OWNER;
  }

  isTenant(): boolean {
    return this.name === RoleName.TENANT;
  }
}

export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMMUNITY_ADMIN = 'COMMUNITY_ADMIN',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  RESIDENT = 'RESIDENT',
  CONCIERGE = 'CONCIERGE',
}

export enum Permission {
  // Super Admin - Acceso total
  MANAGE_ALL_ORGANIZATIONS = 'manage_all_organizations',
  MANAGE_ALL_USERS = 'manage_all_users',
  VIEW_SYSTEM_METRICS = 'view_system_metrics',

  // Community Admin - Gestión de su comunidad
  MANAGE_COMMUNITY = 'manage_community',
  MANAGE_COMMUNITY_USERS = 'manage_community_users',
  MANAGE_COMMUNITY_UNITS = 'manage_community_units',
  MANAGE_COMMUNITY_EXPENSES = 'manage_community_expenses',
  VIEW_COMMUNITY_REPORTS = 'view_community_reports',

  // Concierge - Gestión de servicios
  MANAGE_VISITORS = 'manage_visitors',
  MANAGE_PARCELS = 'manage_parcels',
  MANAGE_RESERVATIONS = 'manage_reservations',
  VIEW_COMMUNITY_ANNOUNCEMENTS = 'view_community_announcements',

  // Usuarios de comunidad
  VIEW_OWN_UNIT = 'view_own_unit',
  VIEW_OWN_EXPENSES = 'view_own_expenses',
  MANAGE_OWN_PROFILE = 'manage_own_profile',
  CREATE_INCIDENTS = 'create_incidents',
  VIEW_ANNOUNCEMENTS = 'view_announcements',
  MANAGE_OWN_VISITORS = 'manage_own_visitors',
}
