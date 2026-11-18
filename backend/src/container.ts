import type { AppConfig } from './config';
import { AdminController } from './controllers/AdminController';
import { AuthController } from './controllers/AuthController';
import { CartController } from './controllers/CartController';
import { DeliveryController } from './controllers/DeliveryController';
import { DiscountController } from './controllers/DiscountController';
import { OrderController } from './controllers/OrderController';
import { ProductController } from './controllers/ProductController';
import { createAuthMiddleware, type AuthMiddleware } from './middleware/auth';
import { AppDatabase } from './repositories/AppDatabase';
import { CartRepository } from './repositories/CartRepository';
import { DiscountRepository } from './repositories/DiscountRepository';
import { OrderRepository } from './repositories/OrderRepository';
import { ProductRepository } from './repositories/ProductRepository';
import { UserRepository } from './repositories/UserRepository';
import { AdminService } from './services/AdminService';
import { AuthService } from './services/AuthService';
import { CartService } from './services/CartService';
import { DiscountService } from './services/DiscountService';
import { OrderService } from './services/OrderService';
import { ProductService } from './services/ProductService';

export interface Container {
  config: AppConfig;
  db: AppDatabase;
  repositories: {
    users: UserRepository;
    products: ProductRepository;
    discounts: DiscountRepository;
    orders: OrderRepository;
    carts: CartRepository;
  };
  services: {
    auth: AuthService;
    products: ProductService;
    discounts: DiscountService;
    cart: CartService;
    orders: OrderService;
    admin: AdminService;
  };
  middleware: { auth: AuthMiddleware };
  controllers: {
    auth: AuthController;
    products: ProductController;
    discounts: DiscountController;
    delivery: DeliveryController;
    cart: CartController;
    orders: OrderController;
    admin: AdminController;
  };
}

export function createContainer(config: AppConfig): Container {
  const db = new AppDatabase(config.dbPath);

  const users = new UserRepository(db);
  const productsRepository = new ProductRepository(db);
  const discountsRepository = new DiscountRepository(db);
  const carts = new CartRepository(db);
  const ordersRepository = new OrderRepository(db, users, discountsRepository);

  const repositories = {
    users,
    products: productsRepository,
    discounts: discountsRepository,
    orders: ordersRepository,
    carts,
  };

  const auth = new AuthService(users, config.jwtSecret);
  const products = new ProductService(productsRepository);
  const discounts = new DiscountService(discountsRepository);
  const cart = new CartService(db, users, productsRepository, discountsRepository, ordersRepository, carts);
  const orders = new OrderService(db, users, productsRepository, ordersRepository, carts, cart);
  const admin = new AdminService(users, productsRepository, ordersRepository);

  const services = { auth, products, discounts, cart, orders, admin };
  const middleware = { auth: createAuthMiddleware(auth) };

  const controllers = {
    auth: new AuthController(auth),
    products: new ProductController(products),
    discounts: new DiscountController(discounts),
    delivery: new DeliveryController(),
    cart: new CartController(cart),
    orders: new OrderController(orders),
    admin: new AdminController(admin, orders),
  };

  return { config, db, repositories, services, middleware, controllers };
}
