import { Product } from '../Product';
import { DomainError } from '../errors/DomainError';
import { roundMoney } from '../money';

export class SubscriptionProduct extends Product {
  private durationMonths: number;
  private autoRenew: boolean;

  public constructor(
    id: string,
    name: string,
    description: string,
    category: string,
    sku: string,
    price: number,
    durationMonths: number,
    autoRenew: boolean,
    createdAt?: Date,
  ) {
    super(id, name, description, category, sku, price, createdAt);
    this.assertDuration(durationMonths);
    this.durationMonths = durationMonths;
    this.autoRenew = autoRenew;
  }

  /** Price is monthly; a subscription line charges the whole term up front. */
  public override calculatePrice(quantity: number): number {
    this.assertQuantity(quantity);
    return roundMoney(this.getPrice() * this.durationMonths * quantity);
  }

  public override getType(): 'subscription' {
    return 'subscription';
  }

  public override getDetails(): Record<string, unknown> {
    return {
      durationMonths: this.durationMonths,
      autoRenew: this.autoRenew,
      recurringBilling: true,
    };
  }

  public getDurationMonths(): number {
    return this.durationMonths;
  }

  public getAutoRenew(): boolean {
    return this.autoRenew;
  }

  public setDurationMonths(months: number): void {
    this.assertDuration(months);
    this.durationMonths = months;
  }

  public setAutoRenew(autoRenew: boolean): void {
    this.autoRenew = autoRenew;
  }

  private assertDuration(months: number): void {
    if (!Number.isInteger(months) || months <= 0) {
      throw new DomainError('Subscription duration must be a positive integer number of months', 'INVALID_DURATION');
    }
  }
}
