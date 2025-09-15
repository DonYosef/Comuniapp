export class UserRole {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly roleId: string,
  ) {}

  static create(userId: string, roleId: string): UserRole {
    return new UserRole('', userId, roleId);
  }
}
