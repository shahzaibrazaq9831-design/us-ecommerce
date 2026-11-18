import { PhysicalProduct } from '../domain/products/PhysicalProduct';
import { roundMoney } from '../domain/money';
import type { OrderRepository } from '../repositories/OrderRepository';
import type { ProductRepository } from '../repositories/ProductRepository';
import type { UserRepository } from '../repositories/UserRepository';

const LOW_STOCK_THRESHOLD = 5;

export class AdminService {
  public constructor(
    private readonly users: UserRepository,
    private readonly products: ProductRepository,
    private readonly orders: OrderRepository,
  ) {}

  public listOrders(): Record<string, unknown>[] {
    return this.orders.listAll().map((order) => order.toJSON());
  }

  public listCustomers(): Record<string, unknown>[] {
    return this.users.listCustomers().map((customer) => customer.toJSON());
  }

  public getStats(): Record<string, unknown> {
    const orders = this.orders.listAll();
    const revenue = orders
      .filter((order) => order.getStatus() !== 'CANCELLED' && order.getStatus() !== 'REFUNDED')
      .reduce((total, order) => total + order.getTotalAmount(), 0);

    const lowStock = this.products
      .list()
      .filter((product): product is PhysicalProduct => product instanceof PhysicalProduct)
      .filter((product) => product.getStock() <= LOW_STOCK_THRESHOLD)
      .map((product) => ({
        id: product.getId(),
        name: product.getName(),
        sku: product.getSku(),
        stock: product.getStock(),
      }));

    return {
      revenue: roundMoney(revenue),
      orderCountsByStatus: this.orders.countByStatus(),
      totalOrders: orders.length,
      totalCustomers: this.users.countCustomers(),
      totalProducts: this.products.count(),
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStock,
    };
  }
}
