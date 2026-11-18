import { CreditCardPayment } from '../../src/domain/payments/CreditCardPayment';
import { makeCustomer, makeOrder, makeProduct, productMap } from '../domain-helpers';

describe('Stock rules', () => {
  it('reserves stock on confirm and restores it on cancel', () => {
    const product = makeProduct({ stock: 10 });
    const order = makeOrder(makeCustomer());
    order.addItem(product, 3);

    expect(product.getStock()).toBe(10);
    order.confirm(productMap(product));
    expect(product.getStock()).toBe(7);

    order.cancel(productMap(product), {});
    expect(product.getStock()).toBe(10);
    expect(order.getStatus()).toBe('CANCELLED');
  });

  it('never allows stock to become negative', () => {
    const product = makeProduct({ stock: 2 });
    const order = makeOrder(makeCustomer());
    order.addItem(product, 1);

    expect(() => order.confirm(productMap(product))).not.toThrow();
    expect(product.getStock()).toBe(1);

    const secondOrder = makeOrder(makeCustomer());
    secondOrder.addItem(product, 1);
    product.setStock(0); // simulate stock being sold elsewhere after the item was added
    expect(() => secondOrder.confirm(productMap(product))).toThrow(
      expect.objectContaining({ code: 'INSUFFICIENT_STOCK' }),
    );
    expect(product.getStock()).toBe(0);
    expect(secondOrder.getStatus()).toBe('CREATED');
  });

  it('rejects negative reserve/release quantities and negative stock assignment', () => {
    const product = makeProduct({ stock: 5 });
    expect(() => product.reserveStock(-1)).toThrow();
    expect(() => product.releaseStock(0)).toThrow();
    expect(() => product.setStock(-1)).toThrow();
    expect(product.getStock()).toBe(5);
  });

  it('restores stock after an admin refund of a shipped order', () => {
    const product = makeProduct({ stock: 4 });
    const order = makeOrder(makeCustomer());
    order.addItem(product, 2);
    order.confirm(productMap(product));
    order.pay(new CreditCardPayment('4242'), {});
    order.process();
    order.ship();

    expect(product.getStock()).toBe(2);
    order.refund(productMap(product), {});
    expect(product.getStock()).toBe(4);
    expect(order.getStatus()).toBe('REFUNDED');
  });
});
