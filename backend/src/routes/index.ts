import { Router } from 'express';
import type { Container } from '../container';
import { validate } from '../middleware/validate';
import {
  cartItemSchema,
  cartQuantitySchema,
  deliveryCodeSchema,
  deliverySelectionSchema,
  discountCreateSchema,
  discountUpdateSchema,
  idParamSchema,
  loginSchema,
  paymentSchema,
  productCreateSchema,
  productIdParamSchema,
  productUpdateSchema,
  promoSchema,
  registerSchema,
  stockPatchSchema,
  trackingSchema,
  walletTopUpSchema,
} from './schemas';

export function createRoutes(container: Container): Router {
  const router = Router();
  const { controllers, middleware } = container;
  const { authenticate, requireRole } = middleware.auth;
  const admin = [authenticate, requireRole('admin')] as const;
  const customer = [authenticate, requireRole('customer')] as const;

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'order-delivery-backend' });
  });

  // Auth
  router.post('/auth/register', validate(registerSchema), controllers.auth.register);
  router.post('/auth/login', validate(loginSchema), controllers.auth.login);
  router.get('/auth/me', authenticate, controllers.auth.me);

  // Public catalog
  router.get('/products', controllers.products.list);
  router.get('/products/:id', validate(idParamSchema, 'params'), controllers.products.get);
  router.get('/delivery-methods', controllers.delivery.list);

  // Admin products
  router.get('/admin/products', ...admin, controllers.products.list);
  router.post('/admin/products', ...admin, validate(productCreateSchema), controllers.products.create);
  router.get('/admin/products/:id', ...admin, validate(idParamSchema, 'params'), controllers.products.get);
  router.patch(
    '/admin/products/:id',
    ...admin,
    validate(idParamSchema, 'params'),
    validate(productUpdateSchema),
    controllers.products.update,
  );
  router.delete('/admin/products/:id', ...admin, validate(idParamSchema, 'params'), controllers.products.remove);
  router.patch(
    '/admin/products/:id/stock',
    ...admin,
    validate(idParamSchema, 'params'),
    validate(stockPatchSchema),
    controllers.products.setStock,
  );

  // Admin discounts
  router.get('/admin/discounts', ...admin, controllers.discounts.list);
  router.post('/admin/discounts', ...admin, validate(discountCreateSchema), controllers.discounts.create);
  router.get('/admin/discounts/:id', ...admin, validate(idParamSchema, 'params'), controllers.discounts.get);
  router.patch(
    '/admin/discounts/:id',
    ...admin,
    validate(idParamSchema, 'params'),
    validate(discountUpdateSchema),
    controllers.discounts.update,
  );
  router.delete('/admin/discounts/:id', ...admin, validate(idParamSchema, 'params'), controllers.discounts.remove);

  // Admin orders/customers/stats
  router.get('/admin/orders', ...admin, controllers.admin.listOrders);
  router.get('/admin/customers', ...admin, controllers.admin.listCustomers);
  router.get('/admin/stats', ...admin, controllers.admin.stats);
  router.patch('/admin/orders/:id/process', ...admin, validate(idParamSchema, 'params'), controllers.admin.process);
  router.patch(
    '/admin/orders/:id/ship',
    ...admin,
    validate(idParamSchema, 'params'),
    validate(trackingSchema),
    controllers.admin.ship,
  );
  router.patch('/admin/orders/:id/deliver', ...admin, validate(idParamSchema, 'params'), controllers.admin.deliver);
  router.post('/admin/orders/:id/refund', ...admin, validate(idParamSchema, 'params'), controllers.admin.refund);

  // Customer cart
  router.get('/cart', ...customer, controllers.cart.get);
  router.post('/cart/items', ...customer, validate(cartItemSchema), controllers.cart.addItem);
  router.patch(
    '/cart/items/:productId',
    ...customer,
    validate(productIdParamSchema, 'params'),
    validate(cartQuantitySchema),
    controllers.cart.updateItem,
  );
  router.delete(
    '/cart/items/:productId',
    ...customer,
    validate(productIdParamSchema, 'params'),
    controllers.cart.removeItem,
  );
  router.post('/cart/promo', ...customer, validate(promoSchema), controllers.cart.applyPromo);
  router.post('/cart/delivery', ...customer, validate(deliveryCodeSchema), controllers.cart.applyDelivery);

  // Customer orders
  router.post('/orders', ...customer, validate(deliverySelectionSchema), controllers.orders.checkout);
  router.get('/orders', ...customer, controllers.orders.list);
  router.get('/orders/:id', ...customer, validate(idParamSchema, 'params'), controllers.orders.get);
  router.patch(
    '/orders/:id/items',
    ...customer,
    validate(idParamSchema, 'params'),
    validate(cartItemSchema),
    controllers.orders.updateItem,
  );
  router.post('/orders/:id/confirm', ...customer, validate(idParamSchema, 'params'), controllers.orders.confirm);
  router.post('/orders/:id/pay', ...customer, validate(idParamSchema, 'params'), validate(paymentSchema), controllers.orders.pay);
  router.post('/orders/:id/cancel', ...customer, validate(idParamSchema, 'params'), controllers.orders.cancel);
  router.get('/orders/:id/invoice', ...customer, validate(idParamSchema, 'params'), controllers.orders.invoice);
  router.post('/wallet/top-up', ...customer, validate(walletTopUpSchema), controllers.orders.topUp);

  return router;
}
