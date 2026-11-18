import { roundMoney } from '../money';
import type { CustomerTierStrategy } from './CustomerTierStrategy';

export class RegularTier implements CustomerTierStrategy {
  public getTier(): 'REGULAR' {
    return 'REGULAR';
  }

  public calculateDiscount(_subtotal: number): number {
    return 0;
  }

  public qualifiesForFreeShipping(_subtotal: number, _threshold: number): boolean {
    return false;
  }

  public getDescription(): string {
    return 'Regular customer - no automatic discount or free shipping';
  }

  public static snapshot(): Record<string, string | number | boolean> {
    return { discountRate: 0, freeShipping: false, value: roundMoney(0) };
  }
}
