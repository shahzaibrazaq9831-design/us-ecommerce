"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, cartLineKey } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import CartItemDetails from "@/components/CartItemDetails";
import DiscountCodeField from "@/components/DiscountCodeField";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    discount,
    total,
    cartCount,
  } = useCart();
  const { formatPrice } = useCurrency();

  if (cart.length === 0) {
    return (
      <section className="section">
        <div className="container cart-empty">
          <ShoppingBag size={40} strokeWidth={1.2} aria-hidden="true" />
          <h1 className="section-title">Your Cart</h1>
          <p style={{ color: "var(--color-gray-600)", marginBottom: "24px" }}>
            Your cart is empty
          </p>
          <Link href="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">Shopping Cart</h1>
          <p className="section-subtitle">
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="cart-layout">
          <ul className="cart-items">
            {cart.map((item) => {
              const lineKey = cartLineKey(item);

              return (
                <li key={lineKey} className="cart-item">
                  <div className="cart-item-image">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="120px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  <div className="cart-item-body">
                    <Link href={`/products/${item.slug}`} className="cart-item-name">
                      {item.name}
                    </Link>
                    <div className="cart-item-category">{item.categoryLabel}</div>

                    <CartItemDetails item={item} />

                    <div className="cart-item-foot">
                      <div className="cart-qty" aria-label={`Quantity for ${item.name}`}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(lineKey, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus size={14} strokeWidth={2} aria-hidden="true" />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(lineKey, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus size={14} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-item-remove"
                        onClick={() => removeFromCart(lineKey)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-price">{formatPrice(item.price * item.quantity)}</div>
                </li>
              );
            })}
          </ul>

          <aside className="cart-summary">
            <h2 className="cart-summary-title">Order Summary</h2>

            <DiscountCodeField />

            <div className="cart-totals">
              <div className="cart-total-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="cart-total-row cart-total-row--discount">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="cart-total-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="cart-total-row cart-total-row--total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn btn-primary cart-summary-checkout">
              Proceed to Checkout
            </Link>
            <Link href="/shop" className="cart-summary-continue">
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
