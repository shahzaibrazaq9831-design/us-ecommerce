"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  if (cart.length === 0) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <h1 className="section-title">Your Cart</h1>
          <p style={{ color: "var(--color-gray-600)", marginBottom: "24px" }}>Your cart is empty</p>
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
          <p className="section-subtitle">{cartCount} {cartCount === 1 ? "item" : "items"}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
          <div style={{ display: "grid", gap: "16px" }}>
            {cart.map((item) => (
              <div key={item.slug} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "16px", padding: "16px", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)" }}>
                <div style={{ position: "relative", aspectRatio: "3/4" }}>
                  <Image src={item.image} alt={item.name} fill sizes="120px" style={{ objectFit: "cover", borderRadius: "var(--radius-md)" }} />
                </div>
                <div>
                  <Link href={`/products/${item.slug}`} style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    {item.name}
                  </Link>
                  <div style={{ color: "var(--color-gray-600)", margin: "6px 0" }}>{item.category}</div>
                  <div style={{ fontWeight: 700 }}>{formatPrice(item.price)}</div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }}>
                      <button onClick={() => updateQuantity(item.slug, item.quantity - 1)} style={{ padding: "8px 12px" }}>
                        -
                      </button>
                      <span style={{ padding: "8px 16px" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.slug, item.quantity + 1)} style={{ padding: "8px 12px" }}>
                        +
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.slug)} style={{ color: "var(--color-error)" }}>
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "24px", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", height: "fit-content" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "16px" }}>Order Summary</h2>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div style={{ borderTop: "1px solid var(--color-gray-200)", marginTop: "16px", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>Total</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <Link href="/checkout" className="btn btn-primary" style={{ width: "100%", marginTop: "20px" }}>
              Proceed to Checkout
            </Link>
            <Link href="/shop" style={{ display: "block", textAlign: "center", marginTop: "12px", color: "var(--color-gray-600)" }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
