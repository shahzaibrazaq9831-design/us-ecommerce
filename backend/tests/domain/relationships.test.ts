import { Store } from '../../src/domain/Store';
import type { OrderItemView } from '../../src/domain/types';
import { makeCustomer, makeOrder, makeProduct } from '../domain-helpers';

describe('Domain relationships', () => {
  it('composes OrderItems so callers cannot mutate the order through getItems', () => {
    const product = makeProduct();
    const order = makeOrder(makeCustomer());
    order.addItem(product, 2);

    const items = order.getItems() as OrderItemView[];
    items.pop();

    expect(order.getItems()).toHaveLength(1);
    expect(order.getBreakdown().itemCount).toBe(2);
  });

  it('associates a Customer with Orders without owning the customer lifecycle', () => {
    const customer = makeCustomer(undefined, 50);
    const order = makeOrder(customer);

    expect(order.getCustomer()).toBe(customer);
    expect(order.getCustomerId()).toBe(customer.getId());

    customer.addFunds(25);
    expect(customer.getBalance()).toBe(75);
    customer.deductBalance(25);
    expect(customer.getBalance()).toBe(50);
  });

  it('aggregates Products in a Store while leaving them independently usable', () => {
    const product = makeProduct({ id: 'independent-product', price: 42 });
    const store = new Store([product]);

    expect(store.getProductCount()).toBe(1);
    store.removeProduct(product.getId());
    expect(store.getProductCount()).toBe(0);

    // The product still exists and behaves normally after detachment.
    expect(product.calculatePrice(2)).toBe(84);
  });
});
