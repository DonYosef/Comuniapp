export class Organization {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly plan: PlanType,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(name: string, plan: PlanType = PlanType.BASIC): Organization {
    const now = new Date();
    return new Organization(
      '', // ID será generado por la base de datos
      name,
      plan,
      true,
      now,
      now,
    );
  }

  isOrganizationActive(): boolean {
    return this.isActive;
  }

  canCreateCommunities(): boolean {
    return this.isActive && this.plan !== PlanType.BASIC;
  }

  getMaxCommunities(): number {
    switch (this.plan) {
      case PlanType.BASIC:
        return 1;
      case PlanType.PREMIUM:
        return 5;
      case PlanType.ENTERPRISE:
        return -1; // Ilimitado
      default:
        return 1;
    }
  }

  getMaxUsers(): number {
    switch (this.plan) {
      case PlanType.BASIC:
        return 50;
      case PlanType.PREMIUM:
        return 200;
      case PlanType.ENTERPRISE:
        return -1; // Ilimitado
      default:
        return 50;
    }
  }
}

export enum PlanType {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}
