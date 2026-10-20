"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const { wishlist } = useCart();
  const items = products.filter((p) => wishlist.includes(p.slug));

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <h1 className="section-title">My Wishlist</h1>
          <p style={{ color: "var(--color-gray-600)", marginBottom: "24px" }}>Your wishlist is empty</p>
          <Link href="/shop" className="btn btn-primary">
            Discover Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">My Wishlist</h1>
          <p className="section-subtitle">{items.length} {items.length === 1 ? "item" : "items"}</p>
        </div>
        <div className="products-grid">
          {items.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
