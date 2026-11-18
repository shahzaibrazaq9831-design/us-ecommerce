import { PaymentMethod } from '../PaymentMethod';
import type { PaymentContext } from '../types';

export class BankTransferPayment extends PaymentMethod {
  public constructor(
    private readonly bankName: string,
    private readonly accountLast4: string,
  ) {
    super('bank_transfer', 'Bank Transfer');
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
    return { bankName: this.bankName, accountLast4: this.accountLast4 };
  }
}
