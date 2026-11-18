import { roundMoney } from '../money';

export class TaxCalculator {
  public constructor(private readonly taxRate = 0.08) {}

  public calculate(taxableAmount: number): number {
    return roundMoney(Math.max(0, taxableAmount) * this.taxRate);
  }
}
