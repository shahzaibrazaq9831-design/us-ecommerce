import type { Role } from './types';

export abstract class User {
  private readonly id: string;
  private readonly email: string;
  private passwordHash: string;
  private readonly role: Role;
  private readonly createdAt: Date;

  protected constructor(id: string, email: string, passwordHash: string, role: Role, createdAt?: Date) {
    this.id = id;
    this.email = email.toLowerCase();
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = createdAt ?? new Date();
  }

  public getId(): string {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }

  public getPasswordHash(): string {
    return this.passwordHash;
  }

  public setPasswordHash(hash: string): void {
    if (hash.length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    this.passwordHash = hash;
  }

  public getRole(): Role {
    return this.role;
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }
}
