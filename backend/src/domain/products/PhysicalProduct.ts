import { Product } from '../Product';
import { DomainError } from '../errors/DomainError';
import { roundMoney } from '../money';
import type { Dimensions } from '../types';

export class PhysicalProduct extends Product {
  private stock: number;
  private weight: number;
  private dimensions: Dimensions;

  public constructor(
    id: string,
    name: string,
    description: string,
    category: string,
    sku: string,
    price: number,
    stock: number,
    weight: number,
    dimensions: Dimensions,
    createdAt?: Date,
  ) {
    super(id, name, description, category, sku, price, createdAt);
    this.assertStock(stock);
    this.assertWeight(weight);
    this.stock = stock;
    this.weight = weight;
    this.dimensions = { ...dimensions };
  }

  public override calculatePrice(quantity: number): number {
    this.assertQuantity(quantity);
    return roundMoney(this.getPrice() * quantity);
  }

  public override getType(): 'physical' {
    return 'physical';
  }

  public override getDetails(): Record<string, unknown> {
    return {
      stock: this.stock,
      weight: this.weight,
      dimensions: { ...this.dimensions },
    };
  }

  public getStock(): number {
    return this.stock;
  }

  public getWeight(): number {
    return this.weight;
  }

  public getDimensions(): Dimensions {
    return { ...this.dimensions };
  }

  public override getAvailableStock(): number {
    return this.stock;
  }

  public override reserveStock(quantity: number): void {
    this.assertQuantity(quantity);
    if (quantity > this.stock) {
      throw new DomainError(
        `Insufficient stock for ${this.getName()}: requested ${quantity}, available ${this.stock}`,
        'INSUFFICIENT_STOCK',
        409,
      );
    }
    this.stock -= quantity;
  }

  public override releaseStock(quantity: number): void {
    this.assertQuantity(quantity);
    this.stock += quantity;
  }

  public setStock(stock: number): void {
    this.assertStock(stock);
    this.stock = stock;
  }

  public setWeight(weight: number): void {
    this.assertWeight(weight);
    this.weight = weight;
  }

  public setDimensions(dimensions: Dimensions): void {
    this.dimensions = { ...dimensions };
  }

  private assertStock(stock: number): void {
    if (!Number.isInteger(stock) || stock < 0) {
      throw new DomainError('Stock must be a non-negative integer', 'INVALID_STOCK');
    }
  }

  private assertWeight(weight: number): void {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new DomainError('Weight must be a non-negative finite number', 'INVALID_WEIGHT');
    }
  }
}
