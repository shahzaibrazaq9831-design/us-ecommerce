"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import type { CollectionProduct } from "@/data/collections";

interface GalleryProductCardProps {
  product: CollectionProduct;
  /** First visible card can load eagerly for a faster LCP. */
  eager?: boolean;
}

/**
 * Product card matching the reference storefront:
 * 2:3 photo, white "Sale" pill on the top-right, name below, current price and
 * a grey struck-through compare-at price. Only the first two photos are used.
 * On hover-capable laptop/desktop the photo crossfades to the second image
 * with no arrow buttons; phones keep the tap arrows.
 */
export default function GalleryProductCard({
  product,
  eager = false,
}: GalleryProductCardProps) {
  const { formatPrice } = useCurrency();
  // The reference cards use the first two gallery shots only.
  const images = product.images.slice(0, 2);
  const [index, setIndex] = useState(0);
  const total = images.length;
  const hasGallery = total > 1;

  const showPrevious = () => setIndex((current) => (current - 1 + total) % total);
  const showNext = () => setIndex((current) => (current + 1) % total);

  return (
    <article className="gallery-card">
      <div className="gallery-card-media">
        <Link
          href={product.href}
          className="gallery-card-link"
          aria-label={
            product.label ? `${product.label}: ${product.name}` : product.name
          }
        >
          {images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`${product.name}${i > 0 ? " — view 2" : ""}`}
              fill
              sizes="(max-width: 767px) 46vw, (max-width: 1023px) 31vw, 23vw"
              className={`gallery-card-image${
                i > 0 ? " gallery-card-image--alt" : ""
              }${index === i ? " is-active" : ""}`}
              draggable={false}
              loading={eager ? "eager" : "lazy"}
            />
          ))}
        </Link>

        <span className="gallery-card-badge">Sale</span>

        {hasGallery && (
          <>
            <button
              type="button"
              className="gallery-card-arrow gallery-card-arrow--prev"
              onClick={showPrevious}
              aria-label={`Previous photo of ${product.name}`}
            >
              <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="gallery-card-arrow gallery-card-arrow--next"
              onClick={showNext}
              aria-label={`Next photo of ${product.name}`}
            >
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="gallery-card-info">
        {product.label && (
          <span className="gallery-card-label">{product.label}</span>
        )}
        <Link href={product.href} className="gallery-card-name">
          {product.name}
        </Link>
        <div className="gallery-card-price">
          <span className="gallery-card-price-current">
            {formatPrice(product.price)}
          </span>
          <span className="gallery-card-price-old">
            {formatPrice(product.originalPrice)}
          </span>
        </div>
      </div>
    </article>
  );
}
