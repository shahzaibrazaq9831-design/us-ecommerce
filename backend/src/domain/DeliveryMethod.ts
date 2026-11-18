import type { DeliveryCode, DeliverySnapshot } from './types';

export abstract class DeliveryMethod {
  protected constructor(
    private readonly code: DeliveryCode,
    private readonly label: string,
    private readonly description: string,
    private readonly baseCost: number,
    private readonly etaDays: number,
  ) {}

  public getCode(): DeliveryCode {
    return this.code;
  }

  public getLabel(): string {
    return this.label;
  }

  public getDescription(): string {
    return this.description;
  }

  public getBaseCost(): number {
    return this.baseCost;
  }

  public getEtaDays(): number {
    return this.etaDays;
  }

  public abstract calculateShippingCost(subtotal: number): number;

  public abstract estimateDeliveryTime(from?: Date): Date;

  public getSnapshot(): DeliverySnapshot {
    return {
      code: this.getCode(),
      label: this.getLabel(),
      description: this.getDescription(),
      shippingCost: this.calculateShippingCost(0),
      etaDays: this.getEtaDays(),
    };
  }

  protected addDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
