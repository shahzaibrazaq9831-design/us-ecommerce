import type { Product } from './Product';
import { DomainError } from './errors/DomainError';
import { roundMoney } from './money';
import type { OrderItemView } from './types';

export class OrderItem implements OrderItemView {
  private readonly productId: string;
  private productName: string;
  private unitPrice: number;
  private quantity: number;

  public constructor(product: Product, quantity: number) {
    this.assertQuantity(quantity);
    this.productId = product.getId();
    this.productName = product.getName();
    this.unitPrice = product.calculatePrice(1);
    this.quantity = quantity;
  }

  public static fromSnapshot(snapshot: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }): OrderItem {
    const product: Product = {
      getId: () => snapshot.productId,
      getName: () => snapshot.productName,
      calculatePrice: (quantity: number) => roundMoney(snapshot.unitPrice * quantity),
    } as unknown as Product;
    return new OrderItem(product, snapshot.quantity);
  }

  public getProductId(): string {
    return this.productId;
  }

  public getProductName(): string {
    return this.productName;
  }

  public getUnitPrice(): number {
    return this.unitPrice;
  }

  public getQuantity(): number {
    return this.quantity;
  }

  public getSubtotal(): number {
    return roundMoney(this.unitPrice * this.quantity);
  }

  public changeQuantity(quantity: number): void {
    this.assertQuantity(quantity);
    this.quantity = quantity;
  }

  public syncProduct(product: Product): void {
    this.productName = product.getName();
    this.unitPrice = product.calculatePrice(1);
  }

  public toJSON(): Record<string, unknown> {
    return {
      productId: this.getProductId(),
      productName: this.getProductName(),
      unitPrice: this.getUnitPrice(),
      quantity: this.getQuantity(),
      subtotal: this.getSubtotal(),
    };
  }

  private assertQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError('Item quantity must be a positive integer', 'INVALID_QUANTITY');
    }
  }
}
