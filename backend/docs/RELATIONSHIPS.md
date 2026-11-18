# Domain relationships

The backend follows the UML distinctions requested for this system: **composition**, **association**, and **aggregation**. These are expressed in `src/domain` and kept free of Express and SQLite concerns.

## 1. Composition — `Order` owns `OrderItem`

**Rule:** `Order` composes `OrderItem`s.

- `Order` keeps its items in a private array.
- The only ways to change that collection are `addItem`, `removeItem`, `changeItemQuantity`, and `syncProducts`.
- `getItems()` returns detached snapshots, so callers cannot mutate the order's internal collection.
- When an `Order` is deleted from persistence, its `order_items` rows are removed with it (`ON DELETE CASCADE`).

**Why composition?** An order line has no meaning without its parent order. Its quantity, unit price snapshot, and product identity exist to describe that specific order. The lifecycle (confirm, pay, ship, etc.) and the pricing breakdown belong to the order as a whole, not to any individual line.

```text
Order ◆──── OrderItem
  1            1..*
```

## 2. Association — `Customer` ↔ `Order`

**Rule:** A `Customer` is associated with `Order`s.

- `Order` holds a reference to a `Customer` object and exposes `getCustomer()` and `getCustomerId()`.
- The customer is not created, destroyed, or owned by the order.
- Customer balance changes only through `addFunds` and `deductBalance`; `Customer.calculateDiscount` and `qualifiesForFreeShipping` delegate to a tier strategy.
- Persistence stores `orders.customer_id` as a foreign key, but deleting an order never deletes the customer.

**Why association?** Customers exist before they place orders and remain after orders are completed. A customer can have many orders, and an order belongs to exactly one customer. Neither object controls the other's lifetime.

```text
Customer ────────> Order
   1                 0..*
```

## 3. Aggregation — `Store` o- `Product`

**Rule:** A `Store` aggregates `Product`s.

- `Store` has `addProduct`, `removeProduct`, `getProduct`, and `listProducts`.
- Removing a product from a store **detaches** it; it does not destroy the product instance.
- Products are persisted independently in the `products` table and can be edited via admin CRUD regardless of which store catalogs them.
- Existing `OrderItem`s keep a product ID and a name/price snapshot, so catalog changes do not rewrite history.

**Why aggregation?** Products have their own identity and lifecycle. They can be created, repriced, restocked, or removed from the catalog while still being referenced by historical orders. A store is a catalog/view over products, not their owner.

```text
Store o────── Product
  1             0..*
```

## Polymorphic product types

`Product` is abstract. `PhysicalProduct`, `DigitalProduct`, and `SubscriptionProduct` implement `calculatePrice` differently:

- Physical: `price × quantity` and real stock reservation.
- Digital: `price × quantity`, unlimited supply, download link.
- Subscription: `monthlyPrice × durationMonths × quantity`, recurring billing metadata.

Business logic never checks a `type` string. It calls `calculatePrice`, `reserveStock`, `releaseStock`, and `getAvailableStock` polymorphically. Type strings are converted to objects only at the API boundary (`src/controllers/factories.ts`) and when rehydrating database rows (`src/repositories/mappers.ts`).

## Polymorphic customer tiers, payments, delivery, and discounts

The same delegation pattern is used everywhere:

- `Customer` delegates discount and free-shipping rules to `CustomerTierStrategy` implementations.
- `Order` calls `PaymentMethod.pay/refund` without knowing the concrete payment type.
- `PricingCalculator` calls `DeliveryMethod.calculateShippingCost` and `estimateDeliveryTime` polymorphically.
- `DiscountCalculator` calls `Discount.applyDiscount(order)` polymorphically.

This keeps `Order` and the pricing pipeline closed for modification but open for extension: adding a new tier, payment provider, delivery option, or discount rule requires a new class, not changes to business logic.
