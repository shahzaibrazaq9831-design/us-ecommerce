import { User } from './User';

export class Admin extends User {
  private readonly permissions: readonly string[];

  public constructor(
    id: string,
    email: string,
    passwordHash: string,
    permissions: readonly string[] = ['products', 'orders', 'customers', 'discounts', 'stats'],
    createdAt?: Date,
  ) {
    super(id, email, passwordHash, 'admin', createdAt);
    this.permissions = Object.freeze([...permissions]);
  }

  public getPermissions(): readonly string[] {
    return this.permissions;
  }

  public hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      email: this.getEmail(),
      role: this.getRole(),
      permissions: this.getPermissions(),
      createdAt: this.getCreatedAt().toISOString(),
    };
  }
}
