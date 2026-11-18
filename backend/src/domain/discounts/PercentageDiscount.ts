import { Discount } from '../Discount';
import type { DiscountableOrder } from '../types';

export class PercentageDiscount extends Discount {
  private percentage: number;

  public constructor(id: string, code: string, description: string, percentage: number) {
    super(id, code, description, 'percentage');
    this.assertRate(percentage);
    this.percentage = percentage;
  }

  public override applyDiscount(order: DiscountableOrder): number {
    return this.clampToSubtotal((this.subtotalOf(order) * this.percentage) / 100, order);
  }

  public getPercentage(): number {
    return this.percentage;
  }

  public setPercentage(percentage: number): void {
    this.assertRate(percentage);
    this.percentage = percentage;
  }

  public override getDetails(): Record<string, string | number | boolean | null> {
    return { percentage: this.percentage };
  }
}
