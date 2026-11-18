import { roundMoney } from '../money';
import type { OrderItemView } from '../types';

export class SubtotalCalculator {
  public calculate(items: readonly OrderItemView[]): number {
    return roundMoney(items.reduce((total, item) => total + item.getSubtotal(), 0));
  }
}
