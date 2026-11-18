import type { Discount } from '../domain/Discount';
import { BuyOneGetOneDiscount } from '../domain/discounts/BuyOneGetOneDiscount';
import { FixedAmountDiscount } from '../domain/discounts/FixedAmountDiscount';
import { PercentageDiscount } from '../domain/discounts/PercentageDiscount';
import { SeasonalDiscount } from '../domain/discounts/SeasonalDiscount';
import type { AppDatabase } from './AppDatabase';
import { discountFactories } from './mappers';
import type { DiscountRow } from './rows';

export class DiscountRepository {
  public constructor(private readonly db: AppDatabase) {}

  public create(discount: Discount): Discount {
    const values = this.toRowValues(discount);
    this.db.raw
      .prepare(
        `INSERT INTO discounts
          (id, code, description, type, percentage, amount, active_from, active_to, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        discount.getId(),
        discount.getCode(),
        discount.getDescription(),
        discount.getType(),
        values.percentage,
        values.amount,
        values.activeFrom,
        values.activeTo,
        new Date().toISOString(),
      );
    return discount;
  }

  public save(discount: Discount): void {
    const values = this.toRowValues(discount);
    this.db.raw
      .prepare(
        `UPDATE discounts
            SET code = ?, description = ?, percentage = ?, amount = ?, active_from = ?, active_to = ?
          WHERE id = ?`,
      )
      .run(
        discount.getCode(),
        discount.getDescription(),
        values.percentage,
        values.amount,
        values.activeFrom,
        values.activeTo,
        discount.getId(),
      );
  }

  public findById(id: string): Discount | null {
    const row = this.db.raw.prepare('SELECT * FROM discounts WHERE id = ?').get(id) as DiscountRow | undefined;
    return row ? discountFactories[row.type](row) : null;
  }

  public findByCode(code: string): Discount | null {
    const row = this.db.raw.prepare('SELECT * FROM discounts WHERE UPPER(code) = UPPER(?)').get(code) as DiscountRow | undefined;
    return row ? discountFactories[row.type](row) : null;
  }

  public list(): Discount[] {
    const rows = this.db.raw.prepare('SELECT * FROM discounts ORDER BY created_at DESC').all() as DiscountRow[];
    return rows.map((row) => discountFactories[row.type](row));
  }

  public delete(id: string): boolean {
    return this.db.raw.prepare('DELETE FROM discounts WHERE id = ?').run(id).changes > 0;
  }

  public count(): number {
    const result = this.db.raw.prepare('SELECT COUNT(*) AS count FROM discounts').get() as { count: number };
    return result.count;
  }

  private toRowValues(discount: Discount): {
    percentage: number | null;
    amount: number | null;
    activeFrom: string | null;
    activeTo: string | null;
  } {
    return {
      percentage:
        discount instanceof PercentageDiscount || discount instanceof SeasonalDiscount
          ? discount.getPercentage()
          : null,
      amount: discount instanceof FixedAmountDiscount ? discount.getAmount() : null,
      activeFrom:
        discount instanceof SeasonalDiscount && discount.getDetails().activeFrom
          ? String(discount.getDetails().activeFrom)
          : null,
      activeTo:
        discount instanceof SeasonalDiscount && discount.getDetails().activeTo
          ? String(discount.getDetails().activeTo)
          : null,
    };
  }
}
