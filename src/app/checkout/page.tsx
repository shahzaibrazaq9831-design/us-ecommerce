"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { siteConfig } from "@/data/site";

export default function CheckoutPage() {
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const [submitted, setSubmitted] = useState(false);

  if (cart.length === 0 && !submitted) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <h1 className="section-title">Checkout</h1>
          <p style={{ color: "var(--color-gray-600)", marginBottom: "24px" }}>Your cart is empty</p>
          <Link href="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: "center", maxWidth: "600px" }}>
          <h1 className="section-title">Order Placed!</h1>
          <p style={{ color: "var(--color-gray-600)", marginBottom: "24px" }}>
            Thank you for your order. We’ve received your order details and will send a confirmation email shortly.
          </p>
          <Link href="/shop" className="btn btn-primary" onClick={clearCart}>
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  const shipping = cartTotal >= 0 ? 0 : 0; // placeholder
  const discount = cartTotal * 0.1; // demo 10%

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">Checkout</h1>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            clearCart();
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "12px" }}>Contact Information</h2>
                <div style={{ display: "grid", gap: "12px" }}>
                  <input required placeholder="Email" type="email" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                  <input required placeholder="Phone" type="tel" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                </div>
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "12px" }}>Shipping Address</h2>
                <div style={{ display: "grid", gap: "12px" }}>
                  <input required placeholder="Full Name" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                  <input required placeholder="Address" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                  <input required placeholder="City" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <input required placeholder="Postal Code" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                    <input required placeholder="Country" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                  </div>
                </div>
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "12px" }}>Payment</h2>
                <p style={{ color: "var(--color-gray-600)", marginBottom: "12px" }}>This is a demo checkout — no actual payment is collected.</p>
                <div style={{ display: "grid", gap: "12px" }}>
                  <input placeholder="Card Number (demo)" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <input placeholder="Expiry (MM/YY)" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                    <input placeholder="CVV" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: "24px", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", height: "fit-content" }}>
              <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "16px" }}>Order Summary</h2>
              <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                {cart.map((item) => (
                  <div key={item.slug} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ position: "relative", width: "60px", height: "80px", flexShrink: 0 }}>
                      <Image src={item.image} alt={item.name} fill sizes="60px" style={{ objectFit: "cover", borderRadius: "var(--radius-md)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.95rem" }}>{item.name}</div>
                      <div style={{ color: "var(--color-gray-600)", fontSize: "0.85rem" }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Subtotal ({cartCount} items)</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", color: "var(--color-success)" }}>
                <span>Promo ({siteConfig.promoCode}) - 10% off</span>
                <span>-{formatPrice(discount)}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--color-gray-200)", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem" }}>
                <span>Total</span>
                <span>{formatPrice(cartTotal - discount)}</span>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "20px" }}>
                Place Order
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
