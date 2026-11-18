import { DomainError } from './errors/DomainError';
import { roundMoney } from './money';
import type { DiscountSnapshot, DiscountType, DiscountableOrder } from './types';

export abstract class Discount {
  protected constructor(
    private readonly id: string,
    private code: string,
    private description: string,
    private readonly type: DiscountType,
  ) {}

  public getId(): string {
    return this.id;
  }

  public getCode(): string {
    return this.code;
  }

  public getDescription(): string {
    return this.description;
  }

  public getType(): DiscountType {
    return this.type;
  }

  public updateDetails(code: string, description: string): void {
    if (code.trim().length === 0 || description.trim().length === 0) {
      throw new DomainError('Discount code and description are required', 'INVALID_DISCOUNT');
    }
    this.code = code.toUpperCase();
    this.description = description;
  }

  public abstract applyDiscount(order: DiscountableOrder): number;

  public abstract getDetails(): Record<string, string | number | boolean | null>;

  public getSnapshot(): DiscountSnapshot {
    return {
      id: this.getId(),
      code: this.getCode(),
      description: this.getDescription(),
      type: this.getType(),
      details: this.getDetails(),
    };
  }

  protected subtotalOf(order: DiscountableOrder): number {
    return Math.max(0, order.getPricingSubtotal());
  }

  protected clampToSubtotal(amount: number, order: DiscountableOrder): number {
    const subtotal = this.subtotalOf(order);
    return roundMoney(Math.max(0, Math.min(amount, subtotal)));
  }

  protected assertRate(rate: number): void {
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      throw new DomainError('Percentage must be between 0 and 100', 'INVALID_PERCENTAGE');
    }
  }

  protected assertAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new DomainError('Discount amount must be non-negative', 'INVALID_DISCOUNT_AMOUNT');
    }
  }
}
