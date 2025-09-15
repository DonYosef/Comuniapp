export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly status: UserStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    email: string,
    name: string,
    passwordHash: string,
    status: UserStatus = UserStatus.ACTIVE,
  ): User {
    const now = new Date();
    return new User(
      '', // ID será generado por la base de datos
      email,
      name,
      passwordHash,
      status,
      now,
      now,
    );
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isSuspended(): boolean {
    return this.status === UserStatus.SUSPENDED;
  }

  canLogin(): boolean {
    return this.isActive();
  }
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}
