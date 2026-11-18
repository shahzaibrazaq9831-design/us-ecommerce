import type { AppDatabase } from './AppDatabase';

export class CartRepository {
  public constructor(private readonly db: AppDatabase) {}

  public getOrderId(customerId: string): string | null {
    const row = this.db.raw
      .prepare('SELECT order_id FROM carts WHERE customer_id = ?')
      .get(customerId) as { order_id: string } | undefined;
    return row?.order_id ?? null;
  }

  public set(customerId: string, orderId: string): void {
    this.db.raw
      .prepare(
        `INSERT INTO carts (customer_id, order_id) VALUES (?, ?)
         ON CONFLICT(customer_id) DO UPDATE SET order_id = excluded.order_id`,
      )
      .run(customerId, orderId);
  }

  public delete(customerId: string): void {
    this.db.raw.prepare('DELETE FROM carts WHERE customer_id = ?').run(customerId);
  }
}
