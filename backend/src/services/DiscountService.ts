import type { Discount } from '../domain/Discount';
import type { DiscountSnapshot } from '../domain/types';
import { ConflictError, NotFoundError } from '../domain/errors/ApplicationErrors';
import { BuyOneGetOneDiscount } from '../domain/discounts/BuyOneGetOneDiscount';
import { FixedAmountDiscount } from '../domain/discounts/FixedAmountDiscount';
import { PercentageDiscount } from '../domain/discounts/PercentageDiscount';
import { SeasonalDiscount } from '../domain/discounts/SeasonalDiscount';
import type { DiscountRepository } from '../repositories/DiscountRepository';

export interface DiscountUpdateInput {
  code: string;
  description: string;
  percentage?: number;
  amount?: number;
  activeFrom?: string | null;
  activeTo?: string | null;
}

export class DiscountService {
  public constructor(private readonly discounts: DiscountRepository) {}

  public create(discount: Discount): DiscountSnapshot {
    if (this.discounts.findByCode(discount.getCode())) {
      throw new ConflictError('A discount with this code already exists');
    }
    this.discounts.create(discount);
    return discount.getSnapshot();
  }

  public list(): DiscountSnapshot[] {
    return this.discounts.list().map((discount) => discount.getSnapshot());
  }

  public get(id: string): DiscountSnapshot {
    const discount = this.discounts.findById(id);
    if (!discount) {
      throw new NotFoundError('Discount');
    }
    return discount.getSnapshot();
  }

  public findByCode(code: string): Discount | null {
    return this.discounts.findByCode(code);
  }

  public update(id: string, input: DiscountUpdateInput): DiscountSnapshot {
    const discount = this.discounts.findById(id);
    if (!discount) {
      throw new NotFoundError('Discount');
    }
    const duplicate = this.discounts.findByCode(input.code);
    if (duplicate && duplicate.getId() !== id) {
      throw new ConflictError('A discount with this code already exists');
    }

    discount.updateDetails(input.code, input.description);
    this.applyTypeSpecificUpdate(discount, input);
    this.discounts.save(discount);
    return discount.getSnapshot();
  }

  public delete(id: string): void {
    if (!this.discounts.delete(id)) {
      throw new NotFoundError('Discount');
    }
  }

  private applyTypeSpecificUpdate(discount: Discount, input: DiscountUpdateInput): void {
    if (discount instanceof PercentageDiscount) {
      if (input.percentage !== undefined) discount.setPercentage(input.percentage);
      return;
    }
    if (discount instanceof FixedAmountDiscount) {
      if (input.amount !== undefined) discount.setAmount(input.amount);
      return;
    }
    if (discount instanceof SeasonalDiscount) {
      if (input.percentage !== undefined) discount.setPercentage(input.percentage);
      if (input.activeFrom !== undefined || input.activeTo !== undefined) {
        discount.setWindow(
          input.activeFrom ? new Date(input.activeFrom) : null,
          input.activeTo ? new Date(input.activeTo) : null,
        );
      }
      return;
    }
    if (discount instanceof BuyOneGetOneDiscount) {
      // BOGO has no numeric configuration.
    }
  }
}
