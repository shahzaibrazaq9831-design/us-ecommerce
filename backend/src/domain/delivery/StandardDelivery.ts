import { DeliveryMethod } from '../DeliveryMethod';

export class StandardDelivery extends DeliveryMethod {
  public constructor() {
    super('standard', 'Standard', 'Ground delivery in about 5 business days', 5, 5);
  }

  public override calculateShippingCost(_subtotal: number): number {
    return this.getBaseCost();
  }

  public override estimateDeliveryTime(from: Date = new Date()): Date {
    return this.addDays(from, this.getEtaDays());
  }
}
