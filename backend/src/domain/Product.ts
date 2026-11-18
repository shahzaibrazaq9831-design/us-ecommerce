import { DomainError } from './errors/DomainError';
import { roundMoney } from './money';
import type { ProductType } from './types';

export abstract class Product {
  private readonly id: string;
  private readonly createdAt: Date;
  private name: string;
  private description: string;
  private category: string;
  private sku: string;
  private price: number;

  protected constructor(id: string, name: string, description: string, category: string, sku: string, price: number, createdAt?: Date) {
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.name = name;
    this.description = description;
    this.category = category;
    this.sku = sku;
    this.price = roundMoney(price);
    this.validateCommon(this.name, this.description, this.category, this.sku, this.price);
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getCategory(): string {
    return this.category;
  }

  public getSku(): string {
    return this.sku;
  }

  public getPrice(): number {
    return this.price;
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }

  public updateDetails(name: string, description: string, category: string, sku: string, price: number): void {
    this.validateCommon(name, description, category, sku, price);
    this.name = name;
    this.description = description;
    this.category = category;
    this.sku = sku;
    this.price = roundMoney(price);
  }

  public abstract calculatePrice(quantity: number): number;

  public abstract getType(): ProductType;

  public abstract getDetails(): Record<string, unknown>;

  /** Digital and subscription products never deplete stock. */
  public getAvailableStock(): number {
    return Number.POSITIVE_INFINITY;
  }

  /** Default no-op; Physical overrides this to enforce real stock. */
  public reserveStock(_quantity: number): void {
    // Intentionally empty: unlimited products do not reserve stock.
  }

  /** Default no-op; Physical overrides this to return reserved stock. */
  public releaseStock(_quantity: number): void {
    // Intentionally empty: unlimited products do not restore stock.
  }

  public getSnapshot(): Record<string, unknown> {
    return {
      id: this.getId(),
      type: this.getType(),
      name: this.getName(),
      description: this.getDescription(),
      category: this.getCategory(),
      sku: this.getSku(),
      price: this.getPrice(),
      details: this.getDetails(),
      createdAt: this.getCreatedAt().toISOString(),
    };
  }

  protected assertQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError('Quantity must be a positive integer', 'INVALID_QUANTITY');
    }
  }

  private validateCommon(name: string, description: string, category: string, sku: string, price: number): void {
    if (name.trim().length === 0 || category.trim().length === 0 || sku.trim().length === 0) {
      throw new DomainError('Name, category and SKU are required', 'INVALID_PRODUCT');
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new DomainError('Price must be a non-negative finite number', 'INVALID_PRICE');
    }
    if (description.trim().length === 0) {
      throw new DomainError('Description is required', 'INVALID_PRODUCT');
    }
  }
}
