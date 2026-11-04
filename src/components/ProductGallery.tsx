"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

interface ProductGalleryProps {
  images: string[];
  name: string;
  badge?: string;
}

/**
 * Product gallery for the buy page: 3:4 main photo with a thumbnail strip,
 * mirroring the reference storefront's product page.
 *
 * A zoom button (or a click on the photo) opens a fullscreen lightbox with
 * click-to-zoom and pointer pan.
 */
export default function ProductGallery({ images, name, badge }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const total = images.length;
  const current = Math.min(index, total - 1);

  const openLightbox = () => setLightboxOpen(true);

  return (
    <div className="buy-gallery">
      <button
        type="button"
        className="buy-gallery-main"
        aria-label={`Open ${name} photo ${current + 1} full screen`}
        onClick={openLightbox}
      >
        <Image
          key={images[current]}
          src={images[current]}
          alt={`${name}${current > 0 ? ` — view ${current + 1}` : ""}`}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
          priority
          draggable={false}
        />
        {badge && (
          <span className={`product-badge badge-${badge} buy-gallery-badge`}>
            {badge.toUpperCase()}
          </span>
        )}
        <span className="buy-gallery-zoom" aria-hidden="true">
          <ZoomIn size={19} strokeWidth={1.8} />
        </span>
        {total > 1 && (
          <span className="buy-gallery-counter" aria-hidden="true">
            {current + 1} / {total}
          </span>
        )}
      </button>

      {total > 1 && (
        <div className="buy-gallery-thumbs" role="tablist" aria-label={`${name} photos`}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`View photo ${i + 1} of ${name}`}
              className={`buy-gallery-thumb${i === current ? " is-active" : ""}`}
              onClick={() => setIndex(i)}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="88px"
                style={{ objectFit: "cover" }}
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={current}
          name={name}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setIndex}
        />
      )}
    </div>
  );
}
