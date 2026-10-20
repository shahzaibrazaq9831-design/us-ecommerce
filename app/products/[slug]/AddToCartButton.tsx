"use client";

import { useCart } from "@/context/CartContext";
import { Product } from "@/data/products";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <button className="btn btn-primary" onClick={() => addToCart(product)}>
      <i className="fas fa-shopping-bag" /> Add to Cart
    </button>
  );
}
