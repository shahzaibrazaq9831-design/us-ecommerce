import { Customer } from '../domain/Customer';
import { Order } from '../domain/Order';
import { OrderItem } from '../domain/OrderItem';
import type { PaymentSnapshot, PriceBreakdown } from '../domain/types';
import { createPricingCalculator } from '../domain/pricing/createPricingCalculator';
import type { AppDatabase } from './AppDatabase';
import type { DiscountRepository } from './DiscountRepository';
import { deliveryFactories, paymentFactories } from './mappers';
import type { OrderItemRow, OrderRow } from './rows';
import type { UserRepository } from './UserRepository';

export class OrderRepository {
  public constructor(
    private readonly db: AppDatabase,
    private readonly users: UserRepository,
    private readonly discounts: DiscountRepository,
  ) {}

  public save(order: Order, isCart: boolean): void {
    const dates = order.getDates();
    const paymentSnapshot = order.getPaymentSnapshot();
    const promo = order.getPromoDiscount();
    const iso = (value: Date | null) => (value ? value.toISOString() : null);

    this.db.raw
      .prepare(
        `INSERT INTO orders
          (id, customer_id, status, delivery_code, payment_snapshot, promo_discount_id,
           additional_charges, total_amount, breakdown, refunded, is_cart, tracking_number,
           created_at, updated_at, confirmed_at, paid_at, shipped_at, delivered_at,
           cancelled_at, refunded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           customer_id = excluded.customer_id,
           status = excluded.status,
           delivery_code = excluded.delivery_code,
           payment_snapshot = excluded.payment_snapshot,
           promo_discount_id = excluded.promo_discount_id,
           additional_charges = excluded.additional_charges,
           total_amount = excluded.total_amount,
           breakdown = excluded.breakdown,
           refunded = excluded.refunded,
           is_cart = excluded.is_cart,
           tracking_number = excluded.tracking_number,
           updated_at = excluded.updated_at,
           confirmed_at = excluded.confirmed_at,
           paid_at = excluded.paid_at,
           shipped_at = excluded.shipped_at,
           delivered_at = excluded.delivered_at,
           cancelled_at = excluded.cancelled_at,
           refunded_at = excluded.refunded_at`,
      )
      .run(
        order.getId(),
        order.getCustomerId(),
        order.getStatus(),
        order.getDeliveryMethod().getCode(),
        paymentSnapshot ? JSON.stringify(paymentSnapshot) : null,
        promo ? promo.getId() : null,
        order.getAdditionalCharges(),
        order.getTotalAmount(),
        JSON.stringify(order.getBreakdown()),
        order.isRefunded() ? 1 : 0,
        isCart ? 1 : 0,
        order.getTrackingNumber(),
        iso(dates.createdAt ?? null),
        iso(dates.updatedAt ?? null),
        iso(dates.confirmedAt ?? null),
        iso(dates.paidAt ?? null),
        iso(dates.shippedAt ?? null),
        iso(dates.deliveredAt ?? null),
        iso(dates.cancelledAt ?? null),
        iso(dates.refundedAt ?? null),
      );

    this.db.raw.prepare('DELETE FROM order_items WHERE order_id = ?').run(order.getId());
    const insertItem = this.db.raw.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
       VALUES (?, ?, ?, ?, ?)`,
    );
    for (const item of order.getItems()) {
      insertItem.run(
        order.getId(),
        item.getProductId(),
        item.getProductName(),
        item.getUnitPrice(),
        item.getQuantity(),
      );
    }
  }

  public findById(id: string): Order | null {
    const row = this.db.raw.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    return row ? this.map(row) : null;
  }

  public findCartByCustomer(customerId: string): Order | null {
    const row = this.db.raw
      .prepare('SELECT * FROM orders WHERE customer_id = ? AND is_cart = 1 LIMIT 1')
      .get(customerId) as OrderRow | undefined;
    return row ? this.map(row) : null;
  }

  public listByCustomer(customerId: string): Order[] {
    const rows = this.db.raw
      .prepare('SELECT * FROM orders WHERE customer_id = ? AND is_cart = 0 ORDER BY created_at DESC')
      .all(customerId) as OrderRow[];
    return rows.map((row) => this.map(row));
  }

  public listAll(): Order[] {
    const rows = this.db.raw
      .prepare('SELECT * FROM orders WHERE is_cart = 0 ORDER BY created_at DESC')
      .all() as OrderRow[];
    return rows.map((row) => this.map(row));
  }

  public countByStatus(): Record<string, number> {
    const rows = this.db.raw
      .prepare('SELECT status, COUNT(*) AS count FROM orders WHERE is_cart = 0 GROUP BY status')
      .all() as Array<{ status: string; count: number }>;
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});
  }

  public delete(id: string): void {
    this.db.raw.prepare('DELETE FROM orders WHERE id = ?').run(id);
  }

  private map(row: OrderRow): Order {
    const customer = this.users.findById(row.customer_id);
    if (!(customer instanceof Customer)) {
      throw new Error(`Order ${row.id} references a missing customer`);
    }

    const itemRows = this.db.raw
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
      .all(row.id) as OrderItemRow[];
    const items = itemRows.map((item) =>
      OrderItem.fromSnapshot({
        productId: item.product_id,
        productName: item.product_name,
        unitPrice: item.unit_price,
        quantity: item.quantity,
      }),
    );

    const paymentSnapshot = row.payment_snapshot ? (JSON.parse(row.payment_snapshot) as PaymentSnapshot) : null;
    const paymentMethod = paymentSnapshot ? paymentFactories[paymentSnapshot.type](paymentSnapshot) : null;
    const promoDiscount = row.promo_discount_id ? this.discounts.findById(row.promo_discount_id) : null;
    const breakdown = JSON.parse(row.breakdown) as PriceBreakdown;

    return Order.rehydrate({
      id: row.id,
      customer,
      deliveryMethod: deliveryFactories[row.delivery_code](),
      pricingCalculator: createPricingCalculator(),
      items,
      status: row.status,
      paymentMethod,
      paymentSnapshot,
      promoDiscount,
      additionalCharges: row.additional_charges,
      totalAmount: row.total_amount,
      breakdown,
      refunded: Boolean(row.refunded),
      trackingNumber: row.tracking_number,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : null,
      paidAt: row.paid_at ? new Date(row.paid_at) : null,
      shippedAt: row.shipped_at ? new Date(row.shipped_at) : null,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : null,
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
      refundedAt: row.refunded_at ? new Date(row.refunded_at) : null,
    });
  }
}
