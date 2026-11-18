import { Admin } from '../domain/Admin';
import { Customer } from '../domain/Customer';
import { DeliveryMethod } from '../domain/DeliveryMethod';
import { Discount } from '../domain/Discount';
import { PaymentMethod } from '../domain/PaymentMethod';
import { Product } from '../domain/Product';
import { BusinessTier } from '../domain/customer/BusinessTier';
import { PremiumTier } from '../domain/customer/PremiumTier';
import { RegularTier } from '../domain/customer/RegularTier';
import type { CustomerTierStrategy } from '../domain/customer/CustomerTierStrategy';
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
import type {
  CustomerTier,
  DeliveryCode,
  Dimensions,
  DiscountType,
  PaymentSnapshot,
  PaymentType,
  ProductType,
  Role,
} from '../domain/types';
import type { DiscountRow, ProductRow, UserRow } from './rows';

/**
 * These lookup tables are persistence-boundary mappers only. They rehydrate
 * stored discriminator strings into the correct polymorphic instance; no
 * business rule branches on a type string.
 */
export const tierFactories: Readonly<Record<CustomerTier, () => CustomerTierStrategy>> = {
  REGULAR: () => new RegularTier(),
  PREMIUM: () => new PremiumTier(),
  BUSINESS: () => new BusinessTier(),
};

export const productFactories: Readonly<Record<ProductType, (row: ProductRow) => Product>> = {
  physical: (row) =>
    new PhysicalProduct(
      row.id,
      row.name,
      row.description,
      row.category,
      row.sku,
      row.price,
      row.stock ?? 0,
      row.weight ?? 0,
      parseDimensions(row.dimensions),
      new Date(row.created_at),
    ),
  digital: (row) =>
    new DigitalProduct(
      row.id,
      row.name,
      row.description,
      row.category,
      row.sku,
      row.price,
      row.download_link ?? '',
      new Date(row.created_at),
    ),
  subscription: (row) =>
    new SubscriptionProduct(
      row.id,
      row.name,
      row.description,
      row.category,
      row.sku,
      row.price,
      row.duration_months ?? 1,
      Boolean(row.auto_renew),
      new Date(row.created_at),
    ),
};

export const deliveryFactories: Readonly<Record<DeliveryCode, () => DeliveryMethod>> = {
  standard: () => new StandardDelivery(),
  express: () => new ExpressDelivery(),
  same_day: () => new SameDayDelivery(),
};

export const paymentFactories: Readonly<Record<PaymentType, (snapshot: PaymentSnapshot) => PaymentMethod>> = {
  credit_card: (snapshot) =>
    restorePaymentState(new CreditCardPayment(String(snapshot.details.last4 ?? '0000')), snapshot),
  bank_transfer: (snapshot) =>
    restorePaymentState(
      new BankTransferPayment(
        String(snapshot.details.bankName ?? 'Bank'),
        String(snapshot.details.accountLast4 ?? '0000'),
      ),
      snapshot,
    ),
  digital_wallet: (snapshot) =>
    restorePaymentState(new DigitalWalletPayment(String(snapshot.details.provider ?? 'wallet')), snapshot),
};

export const discountFactories: Readonly<Record<DiscountType, (row: DiscountRow) => Discount>> = {
  percentage: (row) => new PercentageDiscount(row.id, row.code, row.description, row.percentage ?? 0),
  fixed_amount: (row) => new FixedAmountDiscount(row.id, row.code, row.description, row.amount ?? 0),
  buy_one_get_one: (row) => new BuyOneGetOneDiscount(row.id, row.code, row.description),
  seasonal: (row) =>
    new SeasonalDiscount(
      row.id,
      row.code,
      row.description,
      row.percentage ?? 0,
      parseOptionalDate(row.active_from),
      parseOptionalDate(row.active_to),
    ),
};

export const roleFactories: Readonly<Record<Role, (row: UserRow) => Admin | Customer>> = {
  admin: (row) => new Admin(row.id, row.email, row.password_hash, undefined, new Date(row.created_at)),
  customer: (row) => {
    const tier = row.customer_tier ?? 'REGULAR';
    return new Customer(
      row.id,
      row.email,
      row.password_hash,
      tierFactories[tier](),
      row.balance,
      row.business_threshold,
      new Date(row.created_at),
    );
  },
};

function restorePaymentState(method: PaymentMethod, snapshot: PaymentSnapshot): PaymentMethod {
  const paid = Number(snapshot.details.paidAmount ?? 0);
  const refunded = Number(snapshot.details.refundedAmount ?? 0);
  method.restoreState(Number.isFinite(paid) ? paid : 0, Number.isFinite(refunded) ? refunded : 0);
  return method;
}

function parseDimensions(raw: string | null): Dimensions {
  if (!raw) {
    return { length: 0, width: 0, height: 0, unit: 'cm' };
  }
  try {
    return JSON.parse(raw) as Dimensions;
  } catch {
    return { length: 0, width: 0, height: 0, unit: 'cm' };
  }
}

export function parseOptionalDate(value: string | null): Date | undefined {
  return value ? new Date(value) : undefined;
}
