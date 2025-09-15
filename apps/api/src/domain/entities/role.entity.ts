export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly permissions: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(name: string, description: string | null, permissions: string[]): Role {
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
}
