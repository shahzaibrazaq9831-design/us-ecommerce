import { CreditCardPayment } from '../../src/domain/payments/CreditCardPayment';
import { DomainError } from '../../src/domain/errors/DomainError';
import { makeCustomer, makeOrder, makeProduct, productMap } from '../domain-helpers';

describe('Order lifecycle', () => {
  it('walks CREATED -> CONFIRMED -> PAID -> PROCESSING -> SHIPPED -> DELIVERED', () => {
    const product = makeProduct({ price: 50, stock: 5 });
    const order = makeOrder(makeCustomer());
    order.addItem(product, 2);

    expect(order.getStatus()).toBe('CREATED');
    order.confirm(productMap(product));
    expect(order.getStatus()).toBe('CONFIRMED');

    order.pay(new CreditCardPayment('4242'), { orderId: order.getId() });
    expect(order.getStatus()).toBe('PAID');

    order.process();
    expect(order.getStatus()).toBe('PROCESSING');

    order.ship('TRACK-1');
    expect(order.getStatus()).toBe('SHIPPED');
    expect(order.getTrackingNumber()).toBe('TRACK-1');

    order.deliver();
    expect(order.getStatus()).toBe('DELIVERED');
  });

  it('rejects an empty order confirmation', () => {
    const order = makeOrder(makeCustomer());
    expect(() => order.confirm(productMap())).toThrow(expect.objectContaining({ code: 'EMPTY_ORDER' }));
    expect(order.getStatus()).toBe('CREATED');
  });

  it('rejects invalid transitions including DELIVERED -> CANCELLED and CANCELLED -> SHIPPED', () => {
    const product = makeProduct({ stock: 5 });
    const delivered = makeOrder(makeCustomer());
    delivered.addItem(product, 1);
    delivered.confirm(productMap(product));
    delivered.pay(new CreditCardPayment('4242'), {});
    delivered.process();
    delivered.ship();
    delivered.deliver();

    expect(() => delivered.cancel(productMap(product), {})).toThrow(
      expect.objectContaining({ code: 'INVALID_TRANSITION' }),
    );

    const cancelled = makeOrder(makeCustomer());
    cancelled.addItem(product, 1);
    cancelled.cancel(productMap(product), {});
    expect(cancelled.getStatus()).toBe('CANCELLED');
    expect(() => cancelled.ship()).toThrow(expect.objectContaining({ code: 'INVALID_TRANSITION' }));
  });

  it('rejects paying before confirmation and delivering before shipping', () => {
    const order = makeOrder(makeCustomer());
    order.addItem(makeProduct(), 1);

    expect(() => order.pay(new CreditCardPayment('4242'), {})).toThrow(DomainError);
    expect(() => order.deliver()).toThrow(expect.objectContaining({ code: 'INVALID_TRANSITION' }));
  });

  it('exposes the transition map through getAllowedTransitions', () => {
    const order = makeOrder(makeCustomer());
    expect(order.getAllowedTransitions()).toEqual(['CONFIRMED', 'CANCELLED']);
  });
});
