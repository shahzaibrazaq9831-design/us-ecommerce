import type { CustomerTier, DeliveryCode, DiscountType, OrderStatus, PaymentType, ProductType, Role } from '../domain/types';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  customer_tier: CustomerTier | null;
  business_threshold: number;
  balance: number;
  created_at: string;
}

export interface ProductRow {
  id: string;
  type: ProductType;
  name: string;
  description: string;
  category: string;
  sku: string;
  price: number;
  stock: number | null;
  weight: number | null;
  dimensions: string | null;
  download_link: string | null;
  duration_months: number | null;
  auto_renew: number | null;
  created_at: string;
}

export interface DiscountRow {
  id: string;
  code: string;
  description: string;
  type: DiscountType;
  percentage: number | null;
  amount: number | null;
  active_from: string | null;
  active_to: string | null;
  created_at: string;
}

export interface OrderRow {
  id: string;
  customer_id: string;
  status: OrderStatus;
  delivery_code: DeliveryCode;
  payment_snapshot: string | null;
  promo_discount_id: string | null;
  additional_charges: number;
  total_amount: number;
  breakdown: string;
  refunded: number;
  is_cart: number;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
}

export interface OrderItemRow {
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}
