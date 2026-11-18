import type { DeliveryMethod } from '../DeliveryMethod';
import type { Discount } from '../Discount';
import { roundMoney } from '../money';
import type { DiscountableOrder, PriceBreakdown } from '../types';
import { DiscountCalculator } from './DiscountCalculator';
import { ShippingCalculator } from './ShippingCalculator';
import { SubtotalCalculator } from './SubtotalCalculator';
import { TaxCalculator } from './TaxCalculator';

export class PricingCalculator {
  public constructor(
    private readonly subtotalCalculator: SubtotalCalculator,
    private readonly shippingCalculator: ShippingCalculator,
    private readonly taxCalculator: TaxCalculator,
    private readonly discountCalculator: DiscountCalculator,
  ) {}

  public calculate(
    order: DiscountableOrder,
    delivery: DeliveryMethod,
    promo: Discount | null,
    additionalCharges = 0,
  ): PriceBreakdown {
    const items = order.getItems();
    if (items.length === 0) {
      return {
        currency: 'USD',
        itemCount: 0,
        subtotal: 0,
        shipping: 0,
        tax: 0,
        customerDiscount: 0,
        promoDiscount: 0,
        additionalCharges: roundMoney(additionalCharges),
        total: 0,
        estimatedDeliveryDays: delivery.getEtaDays(),
        freeShippingApplied: false,
      };
    }

    const subtotal = this.subtotalCalculator.calculate(items);
    order.setPricingSubtotal(subtotal);

    const { customerDiscount, promoDiscount } = this.discountCalculator.calculate(order, order.getCustomer(), promo, subtotal);
    const taxableAmount = Math.max(0, subtotal - customerDiscount - promoDiscount);
    const tax = this.taxCalculator.calculate(taxableAmount);
    const shipping = this.shippingCalculator.calculate(order.getCustomer(), delivery, subtotal);
    const total = roundMoney(
      Math.max(0, subtotal + shipping + tax - customerDiscount - promoDiscount + additionalCharges),
    );

    return {
      currency: 'USD',
      itemCount: items.reduce((count, item) => count + item.getQuantity(), 0),
      subtotal,
      shipping,
      tax,
      customerDiscount,
      promoDiscount,
      additionalCharges: roundMoney(additionalCharges),
      total,
      estimatedDeliveryDays: delivery.getEtaDays(),
      freeShippingApplied: shipping === 0,
    };
  }
}
