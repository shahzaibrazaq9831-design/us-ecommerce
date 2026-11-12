"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, cartLineKey } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { lockPageScroll, unlockPageScroll } from "@/lib/scrollLock";
import CartItemDetails from "@/components/CartItemDetails";
import DiscountCodeField from "@/components/DiscountCodeField";

/**
 * The cart drawer.
 *
 * The drawer is fixed to the right of the screen and never takes part in
 * the page flow, so opening it cannot move the page. While it is open the
 * page behind it stops scrolling — `lockPageScroll` keeps the scrollbar
 * width reserved, so nothing on the page shifts sideways either.
 */
export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cart,
    cartCount,
    updateQuantity,
    removeFromCart,
    subtotal,
    discount,
    total,
  } = useCart();
  const { formatPrice } = useCurrency();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Freeze the page behind the drawer without changing its layout.
  useEffect(() => {
    if (!isCartOpen) return;

    lockPageScroll();
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      unlockPageScroll();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  return (
    <div className="cart-drawer-layer">
      <div className="cart-drawer-backdrop" onClick={closeCart} aria-hidden="true" />

      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <header className="cart-drawer-head">
          <h2 className="cart-drawer-title">
            Your Cart
            {cartCount > 0 && (
              <span className="cart-drawer-count">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
            )}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X size={20} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="cart-drawer-empty">
            <ShoppingBag size={34} strokeWidth={1.3} aria-hidden="true" />
            <p className="cart-drawer-empty-title">Your cart is empty</p>
            <p className="cart-drawer-empty-copy">
              Pieces you add will wait for you here.
            </p>
            <Link href="/shop" className="btn btn-primary" onClick={closeCart}>
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-drawer-items">
              {cart.map((item) => {
                const lineKey = cartLineKey(item);

                return (
                  <li key={lineKey} className="cart-drawer-item">
                    <div className="cart-drawer-item-image">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="88px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    <div className="cart-drawer-item-body">
                      <Link
                        href={`/products/${item.slug}`}
                        className="cart-drawer-item-name"
                        onClick={closeCart}
                      >
                        {item.name}
                      </Link>

                      <CartItemDetails item={item} />

                      <div className="cart-drawer-item-foot">
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
                          className="cart-drawer-remove"
                          onClick={() => removeFromCart(lineKey)}
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="cart-drawer-item-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="cart-drawer-foot">
              <DiscountCodeField compact />

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
                <div className="cart-total-row cart-total-row--total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="btn btn-primary cart-drawer-checkout"
                onClick={closeCart}
              >
                Proceed to checkout
              </Link>
              <Link
                href="/cart"
                className="cart-drawer-view-cart"
                onClick={closeCart}
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
