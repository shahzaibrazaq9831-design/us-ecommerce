import { randomUUID } from 'node:crypto';
import { Admin } from '../domain/Admin';
import { Customer } from '../domain/Customer';
import type { AppDatabase } from './AppDatabase';
import { roleFactories } from './mappers';
import type { UserRow } from './rows';

export class UserRepository {
  public constructor(private readonly db: AppDatabase) {}

  public create(user: Admin | Customer): Admin | Customer {
    const tier = user instanceof Customer ? user.getTier() : null;
    const threshold = user instanceof Customer ? user.getFreeShippingThreshold() : 0;
    const balance = user instanceof Customer ? user.getBalance() : 0;

    this.db.raw
      .prepare(
        `INSERT INTO users (id, email, password_hash, role, customer_tier, business_threshold, balance, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        user.getId() || randomUUID(),
        user.getEmail(),
        user.getPasswordHash(),
        user.getRole(),
        tier,
        threshold,
        balance,
        user.getCreatedAt().toISOString(),
      );
    return user;
  }

  public save(user: Admin | Customer): void {
    const tier = user instanceof Customer ? user.getTier() : null;
    const threshold = user instanceof Customer ? user.getFreeShippingThreshold() : 0;
    const balance = user instanceof Customer ? user.getBalance() : 0;

    this.db.raw
      .prepare(
        `UPDATE users
            SET email = ?, password_hash = ?, customer_tier = ?, business_threshold = ?, balance = ?
          WHERE id = ?`,
      )
      .run(
        user.getEmail(),
        user.getPasswordHash(),
        tier,
        threshold,
        balance,
        user.getId(),
      );
  }

  public findById(id: string): Admin | Customer | null {
    const row = this.db.raw.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? this.map(row) : null;
  }

  public findByEmail(email: string): Admin | Customer | null {
    const row = this.db.raw.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as UserRow | undefined;
    return row ? this.map(row) : null;
  }

  public emailExists(email: string): boolean {
    return this.findByEmail(email) !== null;
  }

  public listCustomers(): Customer[] {
    const rows = this.db.raw
      .prepare("SELECT * FROM users WHERE role = 'customer' ORDER BY created_at DESC")
      .all() as UserRow[];
    return rows.map((row) => this.map(row) as Customer);
  }

  public countCustomers(): number {
    const result = this.db.raw.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'").get() as { count: number };
    return result.count;
  }

  private map(row: UserRow): Admin | Customer {
    return roleFactories[row.role](row);
  }
}
