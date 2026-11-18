import { Discount } from '../Discount';
import { roundMoney } from '../money';
import type { DiscountableOrder } from '../types';

export class BuyOneGetOneDiscount extends Discount {
  public constructor(id: string, code: string, description: string) {
    super(id, code, description, 'buy_one_get_one');
  }

  public override applyDiscount(order: DiscountableOrder): number {
    const freeUnitsValue = order
      .getItems()
      .reduce((total, item) => total + Math.floor(item.getQuantity() / 2) * item.getUnitPrice(), 0);
    return this.clampToSubtotal(roundMoney(freeUnitsValue), order);
  }

  public override getDetails(): Record<string, string | number | boolean | null> {
    return { rule: 'buy_one_get_one' };
  }
}
