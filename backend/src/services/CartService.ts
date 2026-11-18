import { randomUUID } from 'node:crypto';
import { Customer } from '../domain/Customer';
import { DeliveryMethod } from '../domain/DeliveryMethod';
import { Order } from '../domain/Order';
import type { Product } from '../domain/Product';
import { NotFoundError } from '../domain/errors/ApplicationErrors';
import { StandardDelivery } from '../domain/delivery/StandardDelivery';
import { createPricingCalculator } from '../domain/pricing/createPricingCalculator';
import type { AppDatabase } from '../repositories/AppDatabase';
import type { CartRepository } from '../repositories/CartRepository';
import type { DiscountRepository } from '../repositories/DiscountRepository';
import type { OrderRepository } from '../repositories/OrderRepository';
import type { ProductRepository } from '../repositories/ProductRepository';
import type { UserRepository } from '../repositories/UserRepository';

export class CartService {
  public constructor(
    private readonly db: AppDatabase,
    private readonly users: UserRepository,
    private readonly products: ProductRepository,
    private readonly discounts: DiscountRepository,
    private readonly orders: OrderRepository,
    private readonly carts: CartRepository,
  ) {}

  public getCart(customerId: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadCart(customerId);
      order.syncProducts(this.productMap());
      this.orders.save(order, true);
      return order.toJSON();
    });
  }

  public addItem(customerId: string, productId: string, quantity: number): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadCart(customerId);
      const product = this.requireProduct(productId);
      order.addItem(product, quantity);
      this.orders.save(order, true);
      return order.toJSON();
    });
  }

  public updateItem(customerId: string, productId: string, quantity: number): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadCart(customerId);
      const product = this.requireProduct(productId);
      order.changeItemQuantity(productId, quantity, product);
      this.orders.save(order, true);
      return order.toJSON();
    });
  }

  public removeItem(customerId: string, productId: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadCart(customerId);
      order.removeItem(productId);
      this.orders.save(order, true);
      return order.toJSON();
    });
  }

  public applyPromo(customerId: string, code: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadCart(customerId);
      const discount = this.discounts.findByCode(code);
      if (!discount) {
        throw new NotFoundError('Discount');
      }
      order.applyPromo(discount);
      this.orders.save(order, true);
      return order.toJSON();
    });
  }

  public applyDelivery(customerId: string, method: DeliveryMethod): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadCart(customerId);
      order.changeDeliveryMethod(method);
      this.orders.save(order, true);
      return order.toJSON();
    });
  }

  public loadCart(customerId: string): Order {
    const customer = this.requireCustomer(customerId);
    const cartId = this.carts.getOrderId(customerId);
    const existing = cartId ? this.orders.findById(cartId) : null;
    if (existing && existing.getStatus() === 'CREATED') {
      return existing;
    }

    const order = new Order(randomUUID(), customer, new StandardDelivery(), createPricingCalculator());
    this.orders.save(order, true);
    this.carts.set(customerId, order.getId());
    return order;
  }

  public requireCustomer(customerId: string): Customer {
    const user = this.users.findById(customerId);
    if (!(user instanceof Customer)) {
      throw new NotFoundError('Customer');
    }
    return user;
  }

  private requireProduct(productId: string): Product {
    const product = this.products.findById(productId);
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product;
  }

  private productMap(): ReadonlyMap<string, Product> {
    return new Map(this.products.list().map((product) => [product.getId(), product] as const));
  }
}
