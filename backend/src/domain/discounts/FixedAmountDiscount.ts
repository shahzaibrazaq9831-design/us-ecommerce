import { Discount } from '../Discount';
import type { DiscountableOrder } from '../types';

export class FixedAmountDiscount extends Discount {
  private amount: number;

  public constructor(id: string, code: string, description: string, amount: number) {
    super(id, code, description, 'fixed_amount');
    this.assertAmount(amount);
    this.amount = amount;
  }

  public override applyDiscount(order: DiscountableOrder): number {
    return this.clampToSubtotal(this.amount, order);
  }

  public getAmount(): number {
    return this.amount;
  }

  public setAmount(amount: number): void {
    this.assertAmount(amount);
    this.amount = amount;
  }

  public override getDetails(): Record<string, string | number | boolean | null> {
    return { amount: this.amount };
  }
}
