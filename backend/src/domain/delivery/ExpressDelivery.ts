import { DeliveryMethod } from '../DeliveryMethod';

export class ExpressDelivery extends DeliveryMethod {
  public constructor() {
    super('express', 'Express', 'Priority delivery in about 2 business days', 15, 2);
  }

  public override calculateShippingCost(_subtotal: number): number {
    return this.getBaseCost();
  }

  public override estimateDeliveryTime(from: Date = new Date()): Date {
    return this.addDays(from, this.getEtaDays());
  }
}
