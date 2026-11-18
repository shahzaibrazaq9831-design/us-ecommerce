import { User } from './User';
import { DomainError } from './errors/DomainError';
import { roundMoney } from './money';
import type { CustomerTierStrategy } from './customer/CustomerTierStrategy';
import type { CustomerTier } from './types';

export class Customer extends User {
  private balance: number;
  private readonly tierStrategy: CustomerTierStrategy;
  private readonly freeShippingThreshold: number;

  public constructor(
    id: string,
    email: string,
    passwordHash: string,
    tierStrategy: CustomerTierStrategy,
    balance = 0,
    freeShippingThreshold = 200,
    createdAt?: Date,
  ) {
    super(id, email, passwordHash, 'customer', createdAt);
    this.tierStrategy = tierStrategy;
    this.balance = roundMoney(balance);
    this.freeShippingThreshold = roundMoney(freeShippingThreshold);
  }

  public getBalance(): number {
    return this.balance;
  }

  public getTier(): CustomerTier {
    return this.tierStrategy.getTier();
  }

  public getTierDescription(): string {
    return this.tierStrategy.getDescription();
  }

  public getFreeShippingThreshold(): number {
    return this.freeShippingThreshold;
  }

  public calculateDiscount(subtotal: number): number {
    return roundMoney(Math.max(0, this.tierStrategy.calculateDiscount(Math.max(0, subtotal))));
  }

  public qualifiesForFreeShipping(subtotal: number): boolean {
    return this.tierStrategy.qualifiesForFreeShipping(Math.max(0, subtotal), this.freeShippingThreshold);
  }

  public addFunds(amount: number): void {
    this.assertMoney(amount, 'Top-up amount');
    this.balance = roundMoney(this.balance + amount);
  }

  public deductBalance(amount: number): void {
    this.assertMoney(amount, 'Debit amount');
    if (amount > this.balance) {
      throw new DomainError('Insufficient wallet balance', 'INSUFFICIENT_BALANCE');
    }
    this.balance = roundMoney(this.balance - amount);
  }

  private assertMoney(amount: number, label: string): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new DomainError(`${label} must be a positive finite number`, 'INVALID_AMOUNT');
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.getId(),
      email: this.getEmail(),
      role: this.getRole(),
      tier: this.getTier(),
      tierDescription: this.getTierDescription(),
      balance: this.getBalance(),
      freeShippingThreshold: this.getFreeShippingThreshold(),
      createdAt: this.getCreatedAt().toISOString(),
    };
  }
}
