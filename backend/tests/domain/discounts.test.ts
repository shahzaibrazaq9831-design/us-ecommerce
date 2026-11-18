import { BuyOneGetOneDiscount } from '../../src/domain/discounts/BuyOneGetOneDiscount';
import { FixedAmountDiscount } from '../../src/domain/discounts/FixedAmountDiscount';
import { PercentageDiscount } from '../../src/domain/discounts/PercentageDiscount';
import { SeasonalDiscount } from '../../src/domain/discounts/SeasonalDiscount';
import { makeCustomer, makeOrder, makeProduct, BusinessTier, PremiumTier, RegularTier } from '../domain-helpers';

describe('Customer tier polymorphism', () => {
  it('applies Regular, Premium and Business discounts', () => {
    expect(makeCustomer(new RegularTier()).calculateDiscount(200)).toBe(0);
    expect(makeCustomer(new PremiumTier()).calculateDiscount(200)).toBe(20);
    expect(makeCustomer(new BusinessTier()).calculateDiscount(200)).toBe(30);
  });

  it('applies free-shipping rules polymorphically', () => {
    expect(makeCustomer(new RegularTier()).qualifiesForFreeShipping(1000)).toBe(false);
    expect(makeCustomer(new PremiumTier()).qualifiesForFreeShipping(1)).toBe(true);
    expect(makeCustomer(new BusinessTier(), 0, 150).qualifiesForFreeShipping(149)).toBe(false);
    expect(makeCustomer(new BusinessTier(), 0, 150).qualifiesForFreeShipping(150)).toBe(true);
  });
});

describe('Discount polymorphism', () => {
  function orderWithSubtotal(subtotal: number) {
    const product = makeProduct({ price: subtotal, stock: 10 });
    const order = makeOrder(makeCustomer(new RegularTier()));
    order.addItem(product, 1);
    return order;
  }

  it('calculates percentage, fixed and BOGO discounts through the same interface', () => {
    const order = orderWithSubtotal(100);
    expect(new PercentageDiscount('d1', 'P10', '10 percent', 10).applyDiscount(order)).toBe(10);
    expect(new FixedAmountDiscount('d2', 'F20', '20 dollars', 20).applyDiscount(order)).toBe(20);
    expect(new BuyOneGetOneDiscount('d3', 'BOGO', 'buy one get one').applyDiscount(order)).toBe(0);

    const fourItems = makeOrder(makeCustomer(new RegularTier()));
    fourItems.addItem(makeProduct({ price: 30, stock: 10 }), 4);
    expect(new BuyOneGetOneDiscount('d4', 'BOGO', 'buy one get one').applyDiscount(fourItems)).toBe(60);
  });

  it('honours seasonal active windows', () => {
    const order = orderWithSubtotal(200);
    const active = new SeasonalDiscount('d5', 'SUMMER', 'summer sale', 25);
    expect(active.applyDiscount(order)).toBe(50);

    const inactive = new SeasonalDiscount(
      'd6',
      'PAST',
      'expired sale',
      25,
      new Date('2020-01-01T00:00:00Z'),
      new Date('2020-02-01T00:00:00Z'),
    );
    expect(inactive.applyDiscount(order)).toBe(0);
  });

  it('clamps discounts so the payable total is never negative', () => {
    const product = makeProduct({ price: 100, stock: 10 });
    const order = makeOrder(makeCustomer(new RegularTier()));
    order.addItem(product, 1);
    order.applyPromo(new FixedAmountDiscount('d7', 'HUGE', 'too large', 1000));

    expect(order.getBreakdown().promoDiscount).toBe(100);
    expect(order.getBreakdown().total).toBe(5); // shipping still applies; discount is capped at subtotal
    expect(order.getTotalAmount()).toBeGreaterThanOrEqual(0);
  });
});
