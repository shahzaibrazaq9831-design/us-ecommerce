import { Customer } from './Customer';
import { DeliveryMethod } from './DeliveryMethod';
import { Discount } from './Discount';
import { OrderItem } from './OrderItem';
import { PaymentMethod } from './PaymentMethod';
import { Product } from './Product';
import { DomainError } from './errors/DomainError';
import { roundMoney } from './money';
import { PricingCalculator } from './pricing/PricingCalculator';
import type {
  DiscountableOrder,
  OrderItemView,
  OrderStatus,
  PaymentContext,
  PaymentSnapshot,
  PriceBreakdown,
} from './types';

const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  CREATED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

const RESERVED_STATUSES: readonly OrderStatus[] = ['CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const READONLY_ITEM_STATUSES: readonly OrderStatus[] = ['CREATED'];

export class Order implements DiscountableOrder {
  private items: OrderItem[];
  private status: OrderStatus = 'CREATED';
  private deliveryMethod: DeliveryMethod;
  private paymentMethod: PaymentMethod | null = null;
  private paymentSnapshot: PaymentSnapshot | null = null;
  private promoDiscount: Discount | null = null;
  private additionalCharges: number;
  private readonly pricingCalculator: PricingCalculator;
  private totalAmount = 0;
  private breakdown: PriceBreakdown;
  private pricingSubtotal = 0;
  private refunded = false;
  private trackingNumber: string | null = null;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private confirmedAt: Date | null = null;
  private paidAt: Date | null = null;
  private shippedAt: Date | null = null;
  private deliveredAt: Date | null = null;
  private cancelledAt: Date | null = null;
  private refundedAt: Date | null = null;

  public constructor(
    private readonly id: string,
    private readonly customer: Customer,
    deliveryMethod: DeliveryMethod,
    pricingCalculator: PricingCalculator,
    createdAt?: Date,
  ) {
    this.deliveryMethod = deliveryMethod;
    this.pricingCalculator = pricingCalculator;
    this.additionalCharges = 0;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = new Date(this.createdAt.getTime());
    this.items = [];
    this.breakdown = this.emptyBreakdown();
    this.recalculate();
  }

  public static rehydrate(params: {
    id: string;
    customer: Customer;
    deliveryMethod: DeliveryMethod;
    pricingCalculator: PricingCalculator;
    items: OrderItem[];
    status: OrderStatus;
    paymentMethod: PaymentMethod | null;
    paymentSnapshot: PaymentSnapshot | null;
    promoDiscount: Discount | null;
    additionalCharges: number;
    totalAmount: number;
    breakdown: PriceBreakdown;
    refunded: boolean;
    trackingNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt?: Date | null;
    paidAt?: Date | null;
    shippedAt?: Date | null;
    deliveredAt?: Date | null;
    cancelledAt?: Date | null;
    refundedAt?: Date | null;
  }): Order {
    const order = new Order(
      params.id,
      params.customer,
      params.deliveryMethod,
      params.pricingCalculator,
      params.createdAt,
    );
    order.items = params.items;
    order.status = params.status;
    order.paymentMethod = params.paymentMethod;
    order.paymentSnapshot = params.paymentSnapshot;
    order.promoDiscount = params.promoDiscount;
    order.additionalCharges = params.additionalCharges;
    order.totalAmount = params.totalAmount;
    order.breakdown = params.breakdown;
    order.pricingSubtotal = params.breakdown.subtotal;
    order.refunded = params.refunded;
    order.trackingNumber = params.trackingNumber;
    order.updatedAt = params.updatedAt;
    order.confirmedAt = params.confirmedAt ?? null;
    order.paidAt = params.paidAt ?? null;
    order.shippedAt = params.shippedAt ?? null;
    order.deliveredAt = params.deliveredAt ?? null;
    order.cancelledAt = params.cancelledAt ?? null;
    order.refundedAt = params.refundedAt ?? null;
    return order;
  }

  public getId(): string {
    return this.id;
  }

  public getCustomer(): Customer {
    return this.customer;
  }

  public getCustomerId(): string {
    return this.customer.getId();
  }

  public getStatus(): OrderStatus {
    return this.status;
  }

  public getTotalAmount(): number {
    return this.totalAmount;
  }

  public getBreakdown(): PriceBreakdown {
    return { ...this.breakdown };
  }

  public getItems(): readonly OrderItemView[] {
    return this.items.map((item) =>
      OrderItem.fromSnapshot({
        productId: item.getProductId(),
        productName: item.getProductName(),
        unitPrice: item.getUnitPrice(),
        quantity: item.getQuantity(),
      }),
    );
  }

  public getDeliveryMethod(): DeliveryMethod {
    return this.deliveryMethod;
  }

  public getPaymentMethod(): PaymentMethod | null {
    return this.paymentMethod;
  }

  public getPaymentSnapshot(): PaymentSnapshot | null {
    return this.paymentSnapshot;
  }

  public getPromoDiscount(): Discount | null {
    return this.promoDiscount;
  }

  public getAdditionalCharges(): number {
    return this.additionalCharges;
  }

  public isRefunded(): boolean {
    return this.refunded;
  }

  public getTrackingNumber(): string | null {
    return this.trackingNumber;
  }

  public getAllowedTransitions(): readonly OrderStatus[] {
    return TRANSITIONS[this.status];
  }

  public getDates(): Readonly<Record<string, Date | null>> {
    return {
      createdAt: new Date(this.createdAt.getTime()),
      updatedAt: new Date(this.updatedAt.getTime()),
      confirmedAt: this.confirmedAt ? new Date(this.confirmedAt.getTime()) : null,
      paidAt: this.paidAt ? new Date(this.paidAt.getTime()) : null,
      shippedAt: this.shippedAt ? new Date(this.shippedAt.getTime()) : null,
      deliveredAt: this.deliveredAt ? new Date(this.deliveredAt.getTime()) : null,
      cancelledAt: this.cancelledAt ? new Date(this.cancelledAt.getTime()) : null,
      refundedAt: this.refundedAt ? new Date(this.refundedAt.getTime()) : null,
    };
  }

  public getPricingSubtotal(): number {
    return this.pricingSubtotal;
  }

  public setPricingSubtotal(subtotal: number): void {
    this.pricingSubtotal = roundMoney(Math.max(0, subtotal));
  }

  public addItem(product: Product, quantity = 1): void {
    this.assertEditable();
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError('Quantity must be a positive integer', 'INVALID_QUANTITY');
    }

    const existing = this.items.find((item) => item.getProductId() === product.getId());
    const desiredQuantity = (existing?.getQuantity() ?? 0) + quantity;
    this.assertAvailability(product, desiredQuantity);

    if (existing) {
      existing.changeQuantity(desiredQuantity);
    } else {
      this.items.push(new OrderItem(product, quantity));
    }
    this.recalculate();
  }

  public removeItem(productId: string): void {
    this.assertEditable();
    const index = this.items.findIndex((item) => item.getProductId() === productId);
    if (index === -1) {
      throw new DomainError('Product is not in this order', 'ITEM_NOT_FOUND', 404);
    }
    this.items.splice(index, 1);
    this.recalculate();
  }

  public changeItemQuantity(productId: string, quantity: number, product?: Product): void {
    this.assertEditable();
    if (quantity === 0) {
      this.removeItem(productId);
      return;
    }
    const item = this.findItem(productId);
    if (product) {
      this.assertAvailability(product, quantity);
    }
    item.changeQuantity(quantity);
    this.recalculate();
  }

  public syncProducts(products: ReadonlyMap<string, Product>): void {
    this.assertEditable();
    for (const item of this.items) {
      const product = products.get(item.getProductId());
      if (!product) {
        throw new DomainError('A product in this order no longer exists', 'PRODUCT_NOT_FOUND', 404);
      }
      item.syncProduct(product);
    }
    this.recalculate();
  }

  public changeDeliveryMethod(method: DeliveryMethod): void {
    if (this.status !== 'CREATED' && this.status !== 'CONFIRMED') {
      throw new DomainError('Delivery method can only change before payment', 'ORDER_NOT_EDITABLE');
    }
    this.deliveryMethod = method;
    this.recalculate();
  }

  public applyPromo(discount: Discount | null): void {
    this.assertEditable();
    this.promoDiscount = discount;
    this.recalculate();
  }

  public confirm(products: ReadonlyMap<string, Product>): void {
    this.assertTransition('CONFIRMED');
    if (this.items.length === 0) {
      throw new DomainError('Cannot confirm an empty order', 'EMPTY_ORDER');
    }

    const reservations = this.items.map((item) => {
      const product = products.get(item.getProductId());
      if (!product) {
        throw new DomainError('A product in this order no longer exists', 'PRODUCT_NOT_FOUND', 404);
      }
      if (item.getQuantity() > product.getAvailableStock()) {
        throw new DomainError(
          `Insufficient stock for ${product.getName()}`,
          'INSUFFICIENT_STOCK',
          409,
        );
      }
      return { product, quantity: item.getQuantity() };
    });

    this.transition('CONFIRMED');
    this.confirmedAt = new Date();

    const reserved: Array<{ product: Product; quantity: number }> = [];
    try {
      for (const reservation of reservations) {
        reservation.product.reserveStock(reservation.quantity);
        reserved.push(reservation);
      }
    } catch (error) {
      for (const reservation of reserved.reverse()) {
        reservation.product.releaseStock(reservation.quantity);
      }
      this.status = 'CREATED';
      this.confirmedAt = null;
      throw error;
    }
    this.recalculate();
  }

  public pay(paymentMethod: PaymentMethod, context: PaymentContext): void {
    this.assertTransition('PAID');
    this.transition('PAID');
    this.paidAt = new Date();

    try {
      if (this.totalAmount > 0) {
        paymentMethod.pay(this.totalAmount, context);
      }
    } catch (error) {
      this.status = 'CONFIRMED';
      this.paidAt = null;
      throw error;
    }

    this.paymentMethod = paymentMethod;
    this.paymentSnapshot = paymentMethod.getSnapshot();
    this.recalculate();
  }

  public process(): void {
    this.transition('PROCESSING');
    this.recalculate();
  }

  public ship(trackingNumber?: string): void {
    this.transition('SHIPPED');
    this.trackingNumber = trackingNumber ?? `TRK-${this.id.slice(0, 8).toUpperCase()}`;
    this.shippedAt = new Date();
    this.recalculate();
  }

  public deliver(): void {
    this.transition('DELIVERED');
    this.deliveredAt = new Date();
    this.recalculate();
  }

  public cancel(products: ReadonlyMap<string, Product>, context: PaymentContext): void {
    this.assertTransition('CANCELLED');
    const shouldRestoreStock = this.hasReservedStock();
    const shouldRefund = this.paymentMethod !== null && !this.refunded && (this.status === 'PAID' || this.status === 'PROCESSING');

    if (shouldRefund) {
      this.refundPayment(context);
    }
    if (shouldRestoreStock) {
      this.restoreStock(products);
    }

    this.transition('CANCELLED');
    this.cancelledAt = new Date();
    this.recalculate();
  }

  public refund(products: ReadonlyMap<string, Product>, context: PaymentContext): void {
    if (this.refunded) {
      throw new DomainError('This order has already been refunded', 'ORDER_ALREADY_REFUNDED', 409);
    }
    this.assertTransition('REFUNDED');
    if (!this.paymentMethod) {
      throw new DomainError('This order has no payment to refund', 'PAYMENT_NOT_FOUND', 409);
    }

    const shouldRestoreStock = this.hasReservedStock();
    this.refundPayment(context);
    if (shouldRestoreStock) {
      this.restoreStock(products);
    }

    this.transition('REFUNDED');
    this.refundedAt = new Date();
    this.recalculate();
  }

  public toJSON(): Record<string, unknown> {
    const dates = this.getDates();
    return {
      id: this.getId(),
      customerId: this.getCustomerId(),
      customer: this.customer.toJSON(),
      status: this.getStatus(),
      items: this.items.map((item) => item.toJSON()),
      deliveryMethod: this.deliveryMethod.getSnapshot(),
      paymentMethod: this.getPaymentSnapshot(),
      promoDiscount: this.promoDiscount ? this.promoDiscount.getSnapshot() : null,
      breakdown: this.getBreakdown(),
      totalAmount: this.getTotalAmount(),
      additionalCharges: this.getAdditionalCharges(),
      refunded: this.isRefunded(),
      trackingNumber: this.getTrackingNumber(),
      allowedTransitions: this.getAllowedTransitions(),
      dates: Object.fromEntries(
        Object.entries(dates).map(([key, value]) => [key, value ? value.toISOString() : null]),
      ),
    };
  }

  public getInvoice(): Record<string, unknown> {
    return {
      invoiceNumber: `INV-${this.id.toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      status: this.getStatus(),
      customer: this.customer.toJSON(),
      items: this.items.map((item) => item.toJSON()),
      deliveryMethod: this.deliveryMethod.getSnapshot(),
      paymentMethod: this.getPaymentSnapshot(),
      breakdown: this.getBreakdown(),
      totalPaid: this.getTotalAmount(),
      refunded: this.isRefunded(),
    };
  }

  private findItem(productId: string): OrderItem {
    const item = this.items.find((candidate) => candidate.getProductId() === productId);
    if (!item) {
      throw new DomainError('Product is not in this order', 'ITEM_NOT_FOUND', 404);
    }
    return item;
  }

  private assertEditable(): void {
    if (!READONLY_ITEM_STATUSES.includes(this.status)) {
      throw new DomainError('Order items can only change while the order is CREATED', 'ORDER_NOT_EDITABLE');
    }
  }

  private assertAvailability(product: Product, quantity: number): void {
    if (quantity > product.getAvailableStock()) {
      throw new DomainError(
        `Insufficient stock for ${product.getName()}`,
        'INSUFFICIENT_STOCK',
        409,
      );
    }
  }

  private assertTransition(next: OrderStatus): void {
    const allowed = TRANSITIONS[this.status];
    if (!allowed.includes(next)) {
      throw new DomainError(
        `Invalid order transition: ${this.status} -> ${next}`,
        'INVALID_TRANSITION',
        409,
      );
    }
  }

  private transition(next: OrderStatus): void {
    this.assertTransition(next);
    this.status = next;
    this.updatedAt = new Date();
  }

  private hasReservedStock(): boolean {
    return RESERVED_STATUSES.includes(this.status);
  }

  private restoreStock(products: ReadonlyMap<string, Product>): void {
    for (const item of this.items) {
      const product = products.get(item.getProductId());
      if (!product) {
        throw new DomainError('Cannot restore stock: product no longer exists', 'PRODUCT_NOT_FOUND', 404);
      }
      product.releaseStock(item.getQuantity());
    }
  }

  private refundPayment(context: PaymentContext): void {
    if (this.totalAmount <= 0) {
      this.refunded = true;
      return;
    }
    const paymentMethod = this.paymentMethod;
    if (!paymentMethod) {
      throw new DomainError('This order has no payment to refund', 'PAYMENT_NOT_FOUND', 409);
    }
    paymentMethod.refund(this.totalAmount, context);
    this.refunded = true;
  }

  private recalculate(): void {
    this.breakdown = this.pricingCalculator.calculate(this, this.deliveryMethod, this.promoDiscount, this.additionalCharges);
    this.totalAmount = this.breakdown.total;
    this.pricingSubtotal = this.breakdown.subtotal;
    this.updatedAt = new Date();
  }

  private emptyBreakdown(): PriceBreakdown {
    return {
      currency: 'USD',
      itemCount: 0,
      subtotal: 0,
      shipping: 0,
      tax: 0,
      customerDiscount: 0,
      promoDiscount: 0,
      additionalCharges: 0,
      total: 0,
      estimatedDeliveryDays: this.deliveryMethod.getEtaDays(),
      freeShippingApplied: false,
    };
  }
}
