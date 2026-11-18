import request from 'supertest';
import { authHeader, createTestContext, type TestContext } from '../helpers';

async function login(ctx: TestContext, email: string, password: string): Promise<string> {
  const response = await request(ctx.app)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  return response.body.token as string;
}

describe('REST API', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(() => {
    ctx.container.db.close();
  });

  it('registers, logs in and serves public catalog data', async () => {
    const register = await request(ctx.app)
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'Password123!' })
      .expect(201);
    expect(register.body.token).toBeDefined();
    expect(register.body.user.role).toBe('customer');

    const login = await request(ctx.app)
      .post('/auth/login')
      .send({ email: 'new@example.com', password: 'Password123!' })
      .expect(200);
    expect(login.body.token).toBeDefined();

    const products = await request(ctx.app).get('/products').expect(200);
    expect(products.body.products).toHaveLength(4);

    const filtered = await request(ctx.app).get('/products?category=digital').expect(200);
    expect(filtered.body.products).toHaveLength(1);
    expect(filtered.body.products[0].type).toBe('digital');

    const delivery = await request(ctx.app).get('/delivery-methods').expect(200);
    expect(delivery.body.deliveryMethods.map((method: { shippingCost: number }) => method.shippingCost)).toEqual([
      5, 15, 30,
    ]);
  });

  it('recalculates cart totals instantly on quantity, promo and delivery changes', async () => {
    const token = await login(ctx, 'regular@example.com', 'Customer123!');
    const headers = authHeader(token);

    const empty = await request(ctx.app).get('/cart').set(headers).expect(200);
    expect(empty.body.cart.breakdown.total).toBe(0);

    const added = await request(ctx.app)
      .post('/cart/items')
      .set(headers)
      .send({ productId: 'seed-product-dress', quantity: 1 })
      .expect(200);
    expect(added.body.cart.breakdown.subtotal).toBeCloseTo(79.99, 2);
    expect(added.body.cart.breakdown.total).toBeCloseTo(91.39, 2);

    const updated = await request(ctx.app)
      .patch('/cart/items/seed-product-dress')
      .set(headers)
      .send({ quantity: 2 })
      .expect(200);
    expect(updated.body.cart.breakdown.subtotal).toBeCloseTo(159.98, 2);
    expect(updated.body.cart.breakdown.total).toBeCloseTo(177.78, 2);

    const promo = await request(ctx.app)
      .post('/cart/promo')
      .set(headers)
      .send({ code: 'SAVE10' })
      .expect(200);
    expect(promo.body.cart.breakdown.promoDiscount).toBeCloseTo(16, 2);
    expect(promo.body.cart.breakdown.total).toBeCloseTo(160.5, 2);

    const delivery = await request(ctx.app)
      .post('/cart/delivery')
      .set(headers)
      .send({ code: 'express' })
      .expect(200);
    expect(delivery.body.cart.breakdown.shipping).toBe(15);
    expect(delivery.body.cart.breakdown.estimatedDeliveryDays).toBe(2);
    expect(delivery.body.cart.breakdown.total).toBeCloseTo(170.5, 2);
  });

  it('drives the full order lifecycle and rejects a double refund', async () => {
    const customerToken = await login(ctx, 'regular@example.com', 'Customer123!');
    const adminToken = await login(ctx, 'admin@example.com', 'Admin123!');
    const customerHeaders = authHeader(customerToken);
    const adminHeaders = authHeader(adminToken);

    await request(ctx.app)
      .post('/cart/items')
      .set(customerHeaders)
      .send({ productId: 'seed-product-dress', quantity: 2 })
      .expect(200);

    const checkout = await request(ctx.app)
      .post('/orders')
      .set(customerHeaders)
      .send({ deliveryMethod: 'standard' })
      .expect(201);
    const orderId = checkout.body.order.id as string;
    expect(checkout.body.order.status).toBe('CREATED');
    expect(checkout.body.order.breakdown.total).toBeCloseTo(177.78, 2);

    const confirmed = await request(ctx.app)
      .post(`/orders/${orderId}/confirm`)
      .set(customerHeaders)
      .expect(200);
    expect(confirmed.body.order.status).toBe('CONFIRMED');

    const paid = await request(ctx.app)
      .post(`/orders/${orderId}/pay`)
      .set(customerHeaders)
      .send({ method: 'credit_card', last4: '4242' })
      .expect(200);
    expect(paid.body.order.status).toBe('PAID');

    const processed = await request(ctx.app)
      .patch(`/admin/orders/${orderId}/process`)
      .set(adminHeaders)
      .expect(200);
    expect(processed.body.order.status).toBe('PROCESSING');

    const shipped = await request(ctx.app)
      .patch(`/admin/orders/${orderId}/ship`)
      .set(adminHeaders)
      .send({ trackingNumber: 'TRK-API-1' })
      .expect(200);
    expect(shipped.body.order.status).toBe('SHIPPED');
    expect(shipped.body.order.trackingNumber).toBe('TRK-API-1');

    const delivered = await request(ctx.app)
      .patch(`/admin/orders/${orderId}/deliver`)
      .set(adminHeaders)
      .expect(200);
    expect(delivered.body.order.status).toBe('DELIVERED');

    const cancelledAfterDelivery = await request(ctx.app)
      .post(`/orders/${orderId}/cancel`)
      .set(customerHeaders)
      .expect(409);
    expect(cancelledAfterDelivery.body.code).toBe('INVALID_TRANSITION');

    const refunded = await request(ctx.app)
      .post(`/admin/orders/${orderId}/refund`)
      .set(adminHeaders)
      .expect(200);
    expect(refunded.body.order.status).toBe('REFUNDED');
    expect(refunded.body.order.refunded).toBe(true);

    const doubleRefund = await request(ctx.app)
      .post(`/admin/orders/${orderId}/refund`)
      .set(adminHeaders)
      .expect(409);
    expect(doubleRefund.body.code).toBe('ORDER_ALREADY_REFUNDED');

    const product = await request(ctx.app).get('/products/seed-product-dress').expect(200);
    expect(product.body.product.details.stock).toBe(25);
  });

  it('supports wallet top-up and digital-wallet payment', async () => {
    const token = await login(ctx, 'premium@example.com', 'Customer123!');
    const headers = authHeader(token);

    const toppedUp = await request(ctx.app)
      .post('/wallet/top-up')
      .set(headers)
      .send({ amount: 100 })
      .expect(200);
    expect(toppedUp.body.customer.balance).toBe(350);

    await request(ctx.app)
      .post('/cart/items')
      .set(headers)
      .send({ productId: 'seed-product-dress', quantity: 1 })
      .expect(200);
    const order = await request(ctx.app)
      .post('/orders')
      .set(headers)
      .send({ deliveryMethod: 'standard' })
      .expect(201);
    await request(ctx.app).post(`/orders/${order.body.order.id}/confirm`).set(headers).expect(200);

    const paid = await request(ctx.app)
      .post(`/orders/${order.body.order.id}/pay`)
      .set(headers)
      .send({ method: 'digital_wallet', provider: 'test-wallet' })
      .expect(200);
    expect(paid.body.order.status).toBe('PAID');

    const me = await request(ctx.app).get('/auth/me').set(headers).expect(200);
    expect(me.body.user.balance).toBeLessThan(350);
    expect(paid.body.order.breakdown.shipping).toBe(0);
  });

  it('enforces admin roles, validation and consistent error responses', async () => {
    const customerToken = await login(ctx, 'regular@example.com', 'Customer123!');
    const adminToken = await login(ctx, 'admin@example.com', 'Admin123!');

    const forbidden = await request(ctx.app)
      .get('/admin/stats')
      .set(authHeader(customerToken))
      .expect(403);
    expect(forbidden.body).toEqual(
      expect.objectContaining({ error: expect.any(String), code: 'AUTHORIZATION_ERROR' }),
    );

    const badLogin = await request(ctx.app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong-password' })
      .expect(401);
    expect(badLogin.body.code).toBe('AUTHENTICATION_ERROR');

    const invalid = await request(ctx.app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');
    expect(invalid.body.details).toBeDefined();

    const created = await request(ctx.app)
      .post('/admin/products')
      .set(authHeader(adminToken))
      .send({
        type: 'physical',
        name: 'Admin Created Dress',
        description: 'Created through the API',
        category: 'apparel',
        sku: 'API-9001',
        price: 45,
        stock: 12,
        weight: 0.5,
        dimensions: { length: 10, width: 10, height: 2, unit: 'cm' },
      })
      .expect(201);
    expect(created.body.product.details.stock).toBe(12);

    const stock = await request(ctx.app)
      .patch(`/admin/products/${created.body.product.id}/stock`)
      .set(authHeader(adminToken))
      .send({ stock: 2 })
      .expect(200);
    expect(stock.body.product.details.stock).toBe(2);

    const stats = await request(ctx.app).get('/admin/stats').set(authHeader(adminToken)).expect(200);
    expect(stats.body.lowStock).toEqual(expect.arrayContaining([expect.objectContaining({ sku: 'API-9001' })]));
  });
});
