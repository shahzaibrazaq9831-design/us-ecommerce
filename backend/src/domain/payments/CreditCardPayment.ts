import { PaymentMethod } from '../PaymentMethod';
import type { PaymentContext } from '../types';

export class CreditCardPayment extends PaymentMethod {
  public constructor(private readonly last4: string) {
    super('credit_card', 'Credit Card');
  }

  public override pay(amount: number, _context: PaymentContext): void {
    this.assertAmount(amount);
    this.recordPayment(amount);
  }

  public override refund(amount: number, _context: PaymentContext): void {
    this.assertAmount(amount);
    this.recordRefund(amount);
  }

  public override getDetails(): Record<string, string | number | boolean> {
    return { last4: this.last4, cardNetwork: 'card' };
  }
}
