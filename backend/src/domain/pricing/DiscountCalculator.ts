import type { Discount } from '../Discount';
import { roundMoney } from '../money';
import type { CustomerView, DiscountableOrder } from '../types';

export interface DiscountAmounts {
  customerDiscount: number;
  promoDiscount: number;
}

export class DiscountCalculator {
  public calculate(
    order: DiscountableOrder,
    customer: CustomerView,
    promo: Discount | null,
    subtotal: number,
  ): DiscountAmounts {
    order.setPricingSubtotal(subtotal);
    const customerDiscount = roundMoney(Math.min(customer.calculateDiscount(subtotal), subtotal));
    const promoDiscount = promo ? roundMoney(Math.min(promo.applyDiscount(order), subtotal)) : 0;
    return {
      customerDiscount: Math.max(0, customerDiscount),
      promoDiscount: Math.max(0, promoDiscount),
    };
  }
}
