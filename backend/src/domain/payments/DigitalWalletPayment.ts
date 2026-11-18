import { PaymentMethod } from '../PaymentMethod';
import type { PaymentContext } from '../types';

export class DigitalWalletPayment extends PaymentMethod {
  public constructor(private readonly provider: string) {
    super('digital_wallet', 'Digital Wallet');
  }

  public override pay(amount: number, context: PaymentContext): void {
    this.assertAmount(amount);
    const customer = this.requireCustomer(context);
    customer.deductBalance(amount);
    this.recordPayment(amount);
  }

  public override refund(amount: number, context: PaymentContext): void {
    this.assertAmount(amount);
    this.recordRefund(amount);
    const customer = this.requireCustomer(context);
    customer.addFunds(amount);
  }

  public override getDetails(): Record<string, string | number | boolean> {
    return { provider: this.provider };
  }
}
