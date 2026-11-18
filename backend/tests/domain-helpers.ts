import { Customer } from '../src/domain/Customer';
import { Order } from '../src/domain/Order';
import { BusinessTier } from '../src/domain/customer/BusinessTier';
import { PremiumTier } from '../src/domain/customer/PremiumTier';
import { RegularTier } from '../src/domain/customer/RegularTier';
import { StandardDelivery } from '../src/domain/delivery/StandardDelivery';
import type { CustomerTierStrategy } from '../src/domain/customer/CustomerTierStrategy';
import type { DeliveryMethod } from '../src/domain/DeliveryMethod';
import type { Product } from '../src/domain/Product';
import { createPricingCalculator } from '../src/domain/pricing/createPricingCalculator';
import { PhysicalProduct } from '../src/domain/products/PhysicalProduct';

export function makeCustomer(
  strategy: CustomerTierStrategy = new RegularTier(),
  balance = 0,
  threshold = 200,
): Customer {
  return new Customer(`customer-${strategy.getTier()}`, 'buyer@example.com', 'hash', strategy, balance, threshold);
}

export function makeProduct(options: {
  id?: string;
  name?: string;
  price?: number;
  stock?: number;
} = {}): PhysicalProduct {
  return new PhysicalProduct(
    options.id ?? 'product-1',
    options.name ?? 'Test Product',
    'A product used in tests',
    'apparel',
    `SKU-${options.id ?? 'product-1'}`,
    options.price ?? 100,
    options.stock ?? 10,
    1,
    { length: 10, width: 10, height: 10, unit: 'cm' },
  );
}

export function makeOrder(customer: Customer, delivery: DeliveryMethod = new StandardDelivery()): Order {
  return new Order('order-1', customer, delivery, createPricingCalculator());
}

export function productMap(...products: Product[]): ReadonlyMap<string, Product> {
  return new Map(products.map((product) => [product.getId(), product] as const));
}

export { BusinessTier, PremiumTier, RegularTier };
