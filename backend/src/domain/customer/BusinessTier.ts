import { roundMoney } from '../money';
import type { CustomerTierStrategy } from './CustomerTierStrategy';

export class BusinessTier implements CustomerTierStrategy {
  private readonly discountRate = 0.15;

  public getTier(): 'BUSINESS' {
    return 'BUSINESS';
  }

  public calculateDiscount(subtotal: number): number {
    return roundMoney(subtotal * this.discountRate);
  }

  public qualifiesForFreeShipping(subtotal: number, threshold: number): boolean {
    return subtotal >= threshold;
  }

  public getDescription(): string {
    return 'Business customer - 15% discount and free shipping above the configured threshold';
  }

  public static snapshot(): Record<string, string | number | boolean> {
    return { discountRate: 0.15, freeShippingAboveThreshold: true };
  }
}
