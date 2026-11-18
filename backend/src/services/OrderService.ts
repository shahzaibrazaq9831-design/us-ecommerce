import { DomainError } from '../domain/errors/DomainError';
import { NotFoundError } from '../domain/errors/ApplicationErrors';
import type { DeliveryMethod } from '../domain/DeliveryMethod';
import type { Order } from '../domain/Order';
import type { PaymentMethod } from '../domain/PaymentMethod';
import type { Product } from '../domain/Product';
import type { AppDatabase } from '../repositories/AppDatabase';
import type { CartRepository } from '../repositories/CartRepository';
import type { OrderRepository } from '../repositories/OrderRepository';
import type { ProductRepository } from '../repositories/ProductRepository';
import type { UserRepository } from '../repositories/UserRepository';
import type { CartService } from './CartService';

export class OrderService {
  public constructor(
    private readonly db: AppDatabase,
    private readonly users: UserRepository,
    private readonly products: ProductRepository,
    private readonly orders: OrderRepository,
    private readonly carts: CartRepository,
    private readonly cartService: CartService,
  ) {}

  public createFromCart(customerId: string, delivery: DeliveryMethod): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.cartService.loadCart(customerId);
      order.syncProducts(this.productMap());
      if (order.getItems().length === 0) {
        throw new DomainError('Cannot create an empty order', 'EMPTY_ORDER');
      }
      order.changeDeliveryMethod(delivery);
      this.orders.save(order, false);
      this.carts.delete(customerId);
      return order.toJSON();
    });
  }

  public listForCustomer(customerId: string): Record<string, unknown>[] {
    this.cartService.requireCustomer(customerId);
    return this.orders.listByCustomer(customerId).map((order) => order.toJSON());
  }

  public get(customerId: string, orderId: string): Record<string, unknown> {
    return this.loadOwned(customerId, orderId).toJSON();
  }

  public getInvoice(customerId: string, orderId: string): Record<string, unknown> {
    return this.loadOwned(customerId, orderId).getInvoice();
  }

  public updateItem(customerId: string, orderId: string, productId: string, quantity: number): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadOwned(customerId, orderId);
      const product = this.requireProduct(productId);
      order.changeItemQuantity(productId, quantity, product);
      this.orders.save(order, false);
      return order.toJSON();
    });
  }

  public confirm(customerId: string, orderId: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadOwned(customerId, orderId);
      const products = this.productMap();
      order.confirm(products);
      this.products.saveAll(products.values());
      this.orders.save(order, false);
      return order.toJSON();
    });
  }

  public pay(customerId: string, orderId: string, payment: PaymentMethod): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadOwned(customerId, orderId);
      const customer = order.getCustomer();
      order.pay(payment, { customer, orderId: order.getId() });
      this.users.save(customer);
      this.orders.save(order, false);
      return order.toJSON();
    });
  }

  public cancel(customerId: string, orderId: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadOwned(customerId, orderId);
      const products = this.productMap();
      const customer = order.getCustomer();
      order.cancel(products, { customer, orderId: order.getId() });
      this.products.saveAll(products.values());
      this.users.save(customer);
      this.orders.save(order, false);
      return order.toJSON();
    });
  }

  public refund(orderId: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadAny(orderId);
      const products = this.productMap();
      const customer = order.getCustomer();
      order.refund(products, { customer, orderId: order.getId() });
      this.products.saveAll(products.values());
      this.users.save(customer);
      this.orders.save(order, false);
      return order.toJSON();
    });
  }

  public process(orderId: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadAny(orderId);
      order.process();
      this.orders.save(order, false);
      return order.toJSON();
    });
  }

  public ship(orderId: string, trackingNumber?: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadAny(orderId);
      order.ship(trackingNumber);
      this.orders.save(order, false);
      return order.toJSON();
    });
  }

  public deliver(orderId: string): Record<string, unknown> {
    return this.db.transaction(() => {
      const order = this.loadAny(orderId);
      order.deliver();
      this.orders.save(order, false);
      return order.toJSON();
    });
  }

  public topUpWallet(customerId: string, amount: number): Record<string, unknown> {
    return this.db.transaction(() => {
      const customer = this.cartService.requireCustomer(customerId);
      customer.addFunds(amount);
      this.users.save(customer);
      return customer.toJSON();
    });
  }

  public loadAny(orderId: string): Order {
    const order = this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }
    return order;
  }

  private loadOwned(customerId: string, orderId: string): Order {
    const order = this.orders.findById(orderId);
    if (!order || order.getCustomerId() !== customerId) {
      throw new NotFoundError('Order');
    }
    return order;
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
