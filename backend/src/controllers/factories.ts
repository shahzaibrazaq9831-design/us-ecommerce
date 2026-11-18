import type { DeliveryMethod } from '../domain/DeliveryMethod';
import type { Discount } from '../domain/Discount';
import type { PaymentMethod } from '../domain/PaymentMethod';
import type { Product } from '../domain/Product';
import { ValidationError } from '../domain/errors/ApplicationErrors';
import { ExpressDelivery } from '../domain/delivery/ExpressDelivery';
import { SameDayDelivery } from '../domain/delivery/SameDayDelivery';
import { StandardDelivery } from '../domain/delivery/StandardDelivery';
import { BuyOneGetOneDiscount } from '../domain/discounts/BuyOneGetOneDiscount';
import { FixedAmountDiscount } from '../domain/discounts/FixedAmountDiscount';
import { PercentageDiscount } from '../domain/discounts/PercentageDiscount';
import { SeasonalDiscount } from '../domain/discounts/SeasonalDiscount';
import { BankTransferPayment } from '../domain/payments/BankTransferPayment';
import { CreditCardPayment } from '../domain/payments/CreditCardPayment';
import { DigitalWalletPayment } from '../domain/payments/DigitalWalletPayment';
import { DigitalProduct } from '../domain/products/DigitalProduct';
import { PhysicalProduct } from '../domain/products/PhysicalProduct';
import { SubscriptionProduct } from '../domain/products/SubscriptionProduct';
import type { DeliveryCode, DiscountType, PaymentType, ProductType } from '../domain/types';
import type {
  DiscountCreateInput,
  PaymentInput,
  ProductCreateInput,
} from '../routes/schemas';

/**
 * API-BOUNDARY factories. These are the ONLY places where discriminator
 * strings from an HTTP request are translated into domain objects.
 */
const productFactories: Readonly<Record<ProductType, (id: string, input: ProductCreateInput) => Product>> = {
  physical: (id, input) => {
    const data = input as Extract<ProductCreateInput, { type: 'physical' }>;
    return new PhysicalProduct(
      id,
      data.name,
      data.description,
      data.category,
      data.sku,
      data.price,
      data.stock,
      data.weight,
      data.dimensions,
    );
  },
  digital: (id, input) => {
    const data = input as Extract<ProductCreateInput, { type: 'digital' }>;
    return new DigitalProduct(id, data.name, data.description, data.category, data.sku, data.price, data.downloadLink);
  },
  subscription: (id, input) => {
    const data = input as Extract<ProductCreateInput, { type: 'subscription' }>;
    return new SubscriptionProduct(
      id,
      data.name,
      data.description,
      data.category,
      data.sku,
      data.price,
      data.durationMonths,
      data.autoRenew,
    );
  },
};

const discountFactories: Readonly<Record<DiscountType, (id: string, input: DiscountCreateInput) => Discount>> = {
  percentage: (id, input) => {
    const data = input as Extract<DiscountCreateInput, { type: 'percentage' }>;
    return new PercentageDiscount(id, data.code, data.description, data.percentage);
  },
  fixed_amount: (id, input) => {
    const data = input as Extract<DiscountCreateInput, { type: 'fixed_amount' }>;
    return new FixedAmountDiscount(id, data.code, data.description, data.amount);
  },
  buy_one_get_one: (id, input) => {
    const data = input as Extract<DiscountCreateInput, { type: 'buy_one_get_one' }>;
    return new BuyOneGetOneDiscount(id, data.code, data.description);
  },
  seasonal: (id, input) => {
    const data = input as Extract<DiscountCreateInput, { type: 'seasonal' }>;
    return new SeasonalDiscount(
      id,
      data.code,
      data.description,
      data.percentage,
      data.activeFrom ? new Date(data.activeFrom) : undefined,
      data.activeTo ? new Date(data.activeTo) : undefined,
    );
  },
};

const deliveryFactories: Readonly<Record<DeliveryCode, () => DeliveryMethod>> = {
  standard: () => new StandardDelivery(),
  express: () => new ExpressDelivery(),
  same_day: () => new SameDayDelivery(),
};

const paymentFactories: Readonly<Record<PaymentType, (input: PaymentInput) => PaymentMethod>> = {
  credit_card: (input) => {
    const data = input as Extract<PaymentInput, { method: 'credit_card' }>;
    return new CreditCardPayment(data.last4);
  },
  bank_transfer: (input) => {
    const data = input as Extract<PaymentInput, { method: 'bank_transfer' }>;
    return new BankTransferPayment(data.bankName, data.accountLast4);
  },
  digital_wallet: (input) => {
    const data = input as Extract<PaymentInput, { method: 'digital_wallet' }>;
    return new DigitalWalletPayment(data.provider);
  },
};

export function makeProduct(id: string, input: ProductCreateInput): Product {
  const factory = productFactories[input.type];
  if (!factory) {
    throw new ValidationError('Unsupported product type');
  }
  return factory(id, input);
}

export function makeDiscount(id: string, input: DiscountCreateInput): Discount {
  const factory = discountFactories[input.type];
  if (!factory) {
    throw new ValidationError('Unsupported discount type');
  }
  return factory(id, input);
}

export function makeDelivery(code: DeliveryCode): DeliveryMethod {
  const factory = deliveryFactories[code];
  if (!factory) {
    throw new ValidationError('Unsupported delivery method');
  }
  return factory();
}

export function makePayment(input: PaymentInput): PaymentMethod {
  const factory = paymentFactories[input.method];
  if (!factory) {
    throw new ValidationError('Unsupported payment method');
  }
  return factory(input);
}
