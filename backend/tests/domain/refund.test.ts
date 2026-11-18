import { DigitalWalletPayment } from '../../src/domain/payments/DigitalWalletPayment';
import { CreditCardPayment } from '../../src/domain/payments/CreditCardPayment';
import { makeCustomer, makeOrder, makeProduct, productMap } from '../domain-helpers';

describe('Payment and refund rules', () => {
  it('refuses to refund the same payment twice', () => {
    const product = makeProduct({ stock: 3 });
    const order = makeOrder(makeCustomer());
    order.addItem(product, 1);
    order.confirm(productMap(product));
    order.pay(new CreditCardPayment('1111'), {});

    order.refund(productMap(product), {});
    expect(order.isRefunded()).toBe(true);
    expect(() => order.refund(productMap(product), {})).toThrow(
      expect.objectContaining({ code: 'ORDER_ALREADY_REFUNDED' }),
    );
  });

  it('makes the payment method itself reject a second refund', () => {
    const payment = new CreditCardPayment('2222');
    payment.pay(50, {});
    payment.refund(50, {});
    expect(() => payment.refund(50, {})).toThrow(
      expect.objectContaining({ code: 'PAYMENT_ALREADY_REFUNDED' }),
    );
  });

  it('deducts and refunds wallet balance exactly once', () => {
    const customer = makeCustomer(undefined, 200);
    const product = makeProduct({ price: 40, stock: 2 });
    const order = makeOrder(customer);
    order.addItem(product, 1);
    order.confirm(productMap(product));

    const wallet = new DigitalWalletPayment('test-wallet');
    const context = { customer };
    order.pay(wallet, context);
    // subtotal 40 + shipping 5 + tax 3.2 = 48.2
    expect(customer.getBalance()).toBeCloseTo(151.8, 2);

    order.refund(productMap(product), context);
    expect(customer.getBalance()).toBeCloseTo(200, 2);
    expect(wallet.getRefundedAmount()).toBeCloseTo(48.2, 2);
  });

  it('refunds automatically when a paid order is cancelled', () => {
    const product = makeProduct({ stock: 2 });
    const order = makeOrder(makeCustomer());
    order.addItem(product, 1);
    order.confirm(productMap(product));
    order.pay(new CreditCardPayment('3333'), {});

    order.cancel(productMap(product), {});
    expect(order.getStatus()).toBe('CANCELLED');
    expect(order.isRefunded()).toBe(true);
    expect(product.getStock()).toBe(2);
  });
});
