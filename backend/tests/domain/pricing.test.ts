import { ExpressDelivery } from '../../src/domain/delivery/ExpressDelivery';
import { FixedAmountDiscount } from '../../src/domain/discounts/FixedAmountDiscount';
import { DigitalProduct } from '../../src/domain/products/DigitalProduct';
import { SubscriptionProduct } from '../../src/domain/products/SubscriptionProduct';
import { makeCustomer, makeOrder, makeProduct, PremiumTier, RegularTier } from '../domain-helpers';

describe('Composite pricing calculator', () => {
  it('applies subtotal + shipping + tax - customer discount - promo discount', () => {
    const order = makeOrder(makeCustomer(new RegularTier()));
    order.addItem(makeProduct({ price: 100 }), 1);

    const breakdown = order.getBreakdown();
    expect(breakdown.subtotal).toBe(100);
    expect(breakdown.shipping).toBe(5);
    expect(breakdown.tax).toBe(8);
    expect(breakdown.customerDiscount).toBe(0);
    expect(breakdown.promoDiscount).toBe(0);
    expect(breakdown.total).toBe(113);
  });

  it('uses customer tier polymorphism for discounts and free shipping', () => {
    const order = makeOrder(makeCustomer(new PremiumTier()));
    order.addItem(makeProduct({ price: 100 }), 1);

    const breakdown = order.getBreakdown();
    expect(breakdown.customerDiscount).toBe(10);
    expect(breakdown.shipping).toBe(0);
    expect(breakdown.tax).toBe(7.2);
    expect(breakdown.total).toBe(97.2);
    expect(breakdown.freeShippingApplied).toBe(true);
  });

  it('delegates price calculation to each product subtype', () => {
    const physical = makeProduct({ price: 20, stock: 10 });
    const digital = new DigitalProduct('digital', 'Pattern', 'Download', 'digital', 'DIG-1', 10, 'https://example.com/a.zip');
    const subscription = new SubscriptionProduct('sub', 'Box', 'Monthly', 'subscription', 'SUB-1', 5, 3, true);

    expect(physical.calculatePrice(3)).toBe(60);
    expect(digital.calculatePrice(2)).toBe(20);
    expect(subscription.calculatePrice(1)).toBe(15);

    const order = makeOrder(makeCustomer(new RegularTier()));
    order.addItem(physical, 3);
    order.addItem(digital, 2);
    order.addItem(subscription, 1);
    expect(order.getBreakdown().subtotal).toBe(95);
    expect(order.getBreakdown().itemCount).toBe(6);
  });

  it('recalculates the full breakdown on every item, delivery and promo change', () => {
    const order = makeOrder(makeCustomer(new RegularTier()));
    const product = makeProduct({ price: 100 });

    expect(order.getTotalAmount()).toBe(0);

    order.addItem(product, 1);
    expect(order.getTotalAmount()).toBe(113);

    order.changeItemQuantity(product.getId(), 2, product);
    expect(order.getBreakdown().subtotal).toBe(200);
    expect(order.getTotalAmount()).toBe(221);

    order.applyPromo(new FixedAmountDiscount('d1', 'FIX20', '$20 off', 20));
    expect(order.getBreakdown().promoDiscount).toBe(20);
    expect(order.getTotalAmount()).toBe(199.4);

    order.changeDeliveryMethod(new ExpressDelivery());
    expect(order.getBreakdown().shipping).toBe(15);
    expect(order.getBreakdown().estimatedDeliveryDays).toBe(2);
    expect(order.getTotalAmount()).toBe(209.4);

    order.removeItem(product.getId());
    expect(order.getBreakdown().subtotal).toBe(0);
    expect(order.getTotalAmount()).toBe(0);
  });
});
