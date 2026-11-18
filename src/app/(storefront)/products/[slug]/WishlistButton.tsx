"use client";

import { useCart } from "@/context/CartContext";

export default function WishlistButton({ slug }: { slug: string }) {
  const { toggleWishlist, isWishlisted } = useCart();
  const wishlisted = isWishlisted(slug);

  return (
    <button className="btn btn-outline" onClick={() => toggleWishlist(slug)}>
      <i className={wishlisted ? "fas fa-heart" : "far fa-heart"} /> {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    </button>
  );
}
