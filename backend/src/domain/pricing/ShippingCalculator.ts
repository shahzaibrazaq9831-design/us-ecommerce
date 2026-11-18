import type { DeliveryMethod } from '../DeliveryMethod';
import type { CustomerView } from '../types';

export class ShippingCalculator {
  public calculate(customer: CustomerView, delivery: DeliveryMethod, subtotal: number): number {
    if (customer.qualifiesForFreeShipping(subtotal)) {
      return 0;
    }
    return delivery.calculateShippingCost(subtotal);
  }
}
