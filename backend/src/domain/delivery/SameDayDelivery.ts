import { DeliveryMethod } from '../DeliveryMethod';

export class SameDayDelivery extends DeliveryMethod {
  public constructor() {
    super('same_day', 'Same Day', 'Same-day courier delivery', 30, 0);
  }

  public override calculateShippingCost(_subtotal: number): number {
    return this.getBaseCost();
  }

  public override estimateDeliveryTime(from: Date = new Date()): Date {
    return this.addDays(from, 0);
  }
}
