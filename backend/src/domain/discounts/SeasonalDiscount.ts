import { Discount } from '../Discount';
import { DomainError } from '../errors/DomainError';
import type { DiscountableOrder } from '../types';

export class SeasonalDiscount extends Discount {
  private percentage: number;
  private activeFrom: Date | null;
  private activeTo: Date | null;

  public constructor(
    id: string,
    code: string,
    description: string,
    percentage: number,
    activeFrom?: Date,
    activeTo?: Date,
  ) {
    super(id, code, description, 'seasonal');
    this.assertRate(percentage);
    this.percentage = percentage;
    this.activeFrom = activeFrom ? new Date(activeFrom.getTime()) : null;
    this.activeTo = activeTo ? new Date(activeTo.getTime()) : null;
    this.assertWindow();
  }

  public override applyDiscount(order: DiscountableOrder): number {
    if (!this.isActive()) {
      return 0;
    }
    return this.clampToSubtotal((this.subtotalOf(order) * this.percentage) / 100, order);
  }

  public isActive(at: Date = new Date()): boolean {
    const time = at.getTime();
    if (this.activeFrom && time < this.activeFrom.getTime()) {
      return false;
    }
    if (this.activeTo && time > this.activeTo.getTime()) {
      return false;
    }
    return true;
  }

  public getPercentage(): number {
    return this.percentage;
  }

  public setPercentage(percentage: number): void {
    this.assertRate(percentage);
    this.percentage = percentage;
  }

  public setWindow(activeFrom: Date | null, activeTo: Date | null): void {
    this.activeFrom = activeFrom ? new Date(activeFrom.getTime()) : null;
    this.activeTo = activeTo ? new Date(activeTo.getTime()) : null;
    this.assertWindow();
  }

  public override getDetails(): Record<string, string | number | boolean | null> {
    return {
      percentage: this.percentage,
      activeFrom: this.activeFrom ? this.activeFrom.toISOString() : null,
      activeTo: this.activeTo ? this.activeTo.toISOString() : null,
      active: this.isActive(),
    };
  }

  private assertWindow(): void {
    if (this.activeFrom && this.activeTo && this.activeFrom.getTime() > this.activeTo.getTime()) {
      throw new DomainError('Discount active window is invalid', 'INVALID_DISCOUNT_WINDOW');
    }
  }
}
