"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, Ruler, ShoppingBag, X, Zap } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import type { DetailProduct } from "@/data/catalog";

const SIZES = ["Xs", "S", "M", "L", "Xl", "2xl", "3xl", "Customised"] as const;
const LININGS = ["Same as model", "Half lining", "Full lining"] as const;

const OFFER_POINTS = [
  "30% OFF Storewide",
  "Free Shipping Worldwide",
  "Buy 2 & Get Extra 10% OFF",
] as const;

interface ProductBuyPanelProps {
  product: DetailProduct;
}

/**
 * Buy panel for the product page — mirrors the reference storefront's
 * purchase section: size guide, offer bullets, size / sleeve-lining selectors,
 * quantity stepper, add to cart, buy now, and a notes field for custom orders.
 */
export default function ProductBuyPanel({ product }: ProductBuyPanelProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { formatPrice } = useCurrency();

  const [size, setSize] = useState<string>("Xs");
  const [lining, setLining] = useState<string>("Same as model");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const soldOut = product.availability === "out_of_stock";
  const wishlisted = isWishlisted(product.slug);
  const onSale = product.originalPrice !== null && product.originalPrice > product.price;
  const discountPercent = onSale
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;

  const buildVariant = () => {
    // Cart lines keep the shared Product shape — the chosen options are the
    // only thing that changes from the product itself.
    return {
      ...product,
      size,
      lining,
      notes: notes.trim() || undefined,
    };
  };

  const handleAddToCart = () => {
    if (soldOut) return;
    addToCart(buildVariant(), quantity);
  };

  const handleBuyNow = () => {
    if (soldOut) return;
    addToCart(buildVariant(), quantity);
    router.push("/checkout");
  };

  return (
    <div className="buy-panel">
      <span className="product-category">{product.category}</span>
      <h1 className="buy-panel-title">{product.name}</h1>

      <div className="review-stars" aria-label={`Rated ${product.rating} out of 5`}>
        {"★".repeat(Math.round(product.rating))}
        {"☆".repeat(5 - Math.round(product.rating))}
        <span className="buy-panel-reviews">
          {product.rating} ({product.reviews} reviews)
        </span>
      </div>

      {/* Price — sale price alongside the struck-through regular price */}
      <div className="buy-panel-price-row">
        <div className="buy-panel-price-block">
          <span className="buy-panel-price-label">{onSale ? "Sale price" : "Price"}</span>
          <span className="buy-panel-price-current">{formatPrice(product.price)}</span>
        </div>
        {onSale && (
          <div className="buy-panel-price-block">
            <span className="buy-panel-price-label">Regular price</span>
            <span className="buy-panel-price-old">{formatPrice(product.originalPrice as number)}</span>
          </div>
        )}
        {onSale && <span className="buy-panel-save">Save {discountPercent}%</span>}
      </div>

      {/* Size guide trigger — opens a modal with the chart */}
      <button
        type="button"
        className="buy-panel-size-guide"
        onClick={() => setSizeGuideOpen(true)}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">📏</span> Size Guide
      </button>

      {/* Store offers */}
      <ul className="buy-panel-offers">
        {OFFER_POINTS.map((offer) => (
          <li key={offer}>
            <Check size={15} strokeWidth={3} aria-hidden="true" />
            <strong>{offer}</strong>
          </li>
        ))}
      </ul>

      {/* Size selector */}
      <fieldset className="buy-panel-fieldset">
        <legend className="buy-panel-legend">
          Size
          <span className="buy-panel-legend-value">{size}</span>
        </legend>
        <div className="buy-panel-pills" role="radiogroup" aria-label="Size">
          {SIZES.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={size === option}
              className={`buy-panel-pill${size === option ? " is-selected" : ""}`}
              onClick={() => setSize(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Sleeve lining selector */}
      <fieldset className="buy-panel-fieldset">
        <legend className="buy-panel-legend">
          Lining In the sleeves
          <span className="buy-panel-legend-value">{lining}</span>
        </legend>
        <div className="buy-panel-pills" role="radiogroup" aria-label="Lining in the sleeves">
          {LININGS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={lining === option}
              className={`buy-panel-pill${lining === option ? " is-selected" : ""}`}
              onClick={() => setLining(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Quantity + Add to cart / Buy now */}
      <div className="buy-panel-purchase">
        <div className="buy-panel-qty" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            disabled={soldOut}
          >
            <Minus size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <input
            type="number"
            min={1}
            max={20}
            value={quantity}
            inputMode="numeric"
            aria-label="Quantity"
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              setQuantity(Number.isFinite(next) ? Math.min(20, Math.max(1, next)) : 1);
            }}
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            aria-label="Increase quantity"
            disabled={soldOut}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary buy-panel-add"
          onClick={handleAddToCart}
          disabled={soldOut}
        >
          <ShoppingBag size={18} strokeWidth={1.75} aria-hidden="true" />
          {soldOut ? "Sold Out" : "Add to Cart"}
        </button>
      </div>

      <button
        type="button"
        className="btn btn-outline buy-panel-buynow"
        onClick={handleBuyNow}
        disabled={soldOut}
      >
        <Zap size={18} strokeWidth={1.75} aria-hidden="true" />
        Buy Now
      </button>

      <button
        type="button"
        className={`buy-panel-wishlist${wishlisted ? " is-active" : ""}`}
        onClick={() => toggleWishlist(product.slug)}
        aria-pressed={wishlisted}
      >
        <i className={wishlisted ? "fas fa-heart" : "far fa-heart"} aria-hidden="true" />
        {wishlisted ? "In Wishlist" : "Add to Wishlist"}
      </button>

      {/* Special notes for tailoring / custom orders */}
      <label className="buy-panel-notes">
        <span className="buy-panel-legend">Special Notes or Customizations</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="E.g. custom measurements, colour change, delivery deadline…"
        />
      </label>

      {/* Express delivery notice */}
      <p className="buy-panel-express">
        <strong>If you need your order Within 10 Days</strong> – Just Pay an <strong>$30 USD Extra</strong>{" "}
        You&apos;ll get your Dress in 10 Days. <strong>Guaranteed!</strong>
      </p>

      {/* Description */}
      <p className="buy-panel-description">{product.description}</p>

      <div className="buy-panel-details">
        <div className="buy-panel-details-title">Product Details</div>
        <ul>
          <li>• Category: {product.category}</li>
          <li>• Hand and sequence embroidery with pearls, cutdana and moti work</li>
          <li>• Kameez, trouser and dupatta — three-piece set</li>
          <li>• Made-to-order stitching available (free tailoring to your size)</li>
          <li>• Worldwide shipping (free on every order)</li>
          <li>• 7-day returns on eligible items</li>
        </ul>
      </div>

      {/* Size guide modal */}
      {sizeGuideOpen && (
        <div className="modal active" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="modal-overlay" onClick={() => setSizeGuideOpen(false)} />
          <div className="modal-content buy-size-guide">
            <button
              className="modal-close"
              onClick={() => setSizeGuideOpen(false)}
              aria-label="Close size guide"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <h2 className="buy-size-guide-title">
              <Ruler size={20} strokeWidth={1.75} aria-hidden="true" /> Size Guide
            </h2>
            <p className="buy-size-guide-copy">
              All measurements are in inches. Between sizes? Choose the larger one or select
              Customised and share your measurements in the notes.
            </p>
            <Image
              src="/images/sizechart.jfif"
              alt="Size chart for shirts, maxi gowns, lehenga cholis and trousers, from 2XS to 2XL, measurements in inches"
              width={1211}
              height={880}
              sizes="(max-width: 768px) 100vw, 760px"
              className="buy-size-guide-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}
