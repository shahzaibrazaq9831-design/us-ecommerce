import { DomainError } from './errors/DomainError';
import type { PaymentContext, PaymentSnapshot, PaymentType } from './types';

export abstract class PaymentMethod {
  private paidAmount = 0;
  private refundedAmount = 0;

  protected constructor(
    private readonly type: PaymentType,
    private readonly label: string,
  ) {}

  public getType(): PaymentType {
    return this.type;
  }

  public getLabel(): string {
    return this.label;
  }

  public getPaidAmount(): number {
    return this.paidAmount;
  }

  public getRefundedAmount(): number {
    return this.refundedAmount;
  }

  public isRefunded(): boolean {
    return this.refundedAmount > 0;
  }

  public abstract pay(amount: number, context: PaymentContext): void;

  public abstract refund(amount: number, context: PaymentContext): void;

  public abstract getDetails(): Record<string, string | number | boolean>;

  public getSnapshot(): PaymentSnapshot {
    return {
      type: this.getType(),
      label: this.getLabel(),
      details: {
        ...this.getDetails(),
        paidAmount: this.paidAmount,
        refundedAmount: this.refundedAmount,
      },
    };
  }

  /** Rehydrates settlement state from a persisted payment snapshot. */
  public restoreState(paidAmount: number, refundedAmount: number): void {
    this.paidAmount = Math.max(0, paidAmount);
    this.refundedAmount = Math.max(0, refundedAmount);
  }

  protected assertAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new DomainError('Payment amount must be a positive finite number', 'INVALID_PAYMENT_AMOUNT');
    }
  }

  protected requireCustomer(context: PaymentContext) {
    if (!context.customer) {
      throw new DomainError('A customer is required for this payment method', 'PAYMENT_CONTEXT_REQUIRED');
    }
    return context.customer;
  }

  protected recordPayment(amount: number): void {
    this.paidAmount += amount;
  }

  protected recordRefund(amount: number): void {
    if (this.paidAmount > 0 && this.refundedAmount + amount > this.paidAmount + 1e-9) {
      throw new DomainError('This payment cannot be refunded twice', 'PAYMENT_ALREADY_REFUNDED', 409);
    }
    this.refundedAmount += amount;
  }
}
