import { roundMoney } from '../money';
import type { CustomerTierStrategy } from './CustomerTierStrategy';

export class PremiumTier implements CustomerTierStrategy {
  private readonly discountRate = 0.1;

  public getTier(): 'PREMIUM' {
    return 'PREMIUM';
  }

  public calculateDiscount(subtotal: number): number {
    return roundMoney(subtotal * this.discountRate);
  }

  public qualifiesForFreeShipping(_subtotal: number, _threshold: number): boolean {
    return true;
  }

  public getDescription(): string {
    return 'Premium customer - 10% discount and free shipping';
  }

  public static snapshot(): Record<string, string | number | boolean> {
    return { discountRate: 0.1, freeShipping: true };
  }
}
