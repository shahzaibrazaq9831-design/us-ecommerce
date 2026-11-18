export type Role = 'customer' | 'admin';
export type CustomerTier = 'REGULAR' | 'PREMIUM' | 'BUSINESS';
export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type ProductType = 'physical' | 'digital' | 'subscription';
export type PaymentType = 'credit_card' | 'bank_transfer' | 'digital_wallet';
export type DeliveryCode = 'standard' | 'express' | 'same_day';
export type DiscountType = 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'seasonal';

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface OrderItemView {
  getProductId(): string;
  getProductName(): string;
  getUnitPrice(): number;
  getQuantity(): number;
  getSubtotal(): number;
}

export interface CustomerView {
  getId(): string;
  calculateDiscount(subtotal: number): number;
  qualifiesForFreeShipping(subtotal: number): boolean;
}

export interface WalletCustomer extends CustomerView {
  deductBalance(amount: number): void;
  addFunds(amount: number): void;
}

/**
 * Minimal read/write view handed to Discount strategies. Order implements it,
 * which keeps Discount polymorphic without importing the concrete Order class.
 */
export interface DiscountableOrder {
  getItems(): readonly OrderItemView[];
  getCustomer(): CustomerView;
  getPricingSubtotal(): number;
  setPricingSubtotal(subtotal: number): void;
}

export interface PaymentContext {
  customer?: WalletCustomer;
  orderId?: string;
}

export interface PaymentSnapshot {
  type: PaymentType;
  label: string;
  details: Record<string, string | number | boolean>;
}

export interface DeliverySnapshot {
  code: DeliveryCode;
  label: string;
  description: string;
  shippingCost: number;
  etaDays: number;
}

export interface DiscountSnapshot {
  id: string;
  code: string;
  description: string;
  type: DiscountType;
  details: Record<string, string | number | boolean | null>;
}

export interface PriceBreakdown {
  currency: string;
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  customerDiscount: number;
  promoDiscount: number;
  additionalCharges: number;
  total: number;
  estimatedDeliveryDays: number;
  freeShippingApplied: boolean;
}
