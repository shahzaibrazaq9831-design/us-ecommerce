"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  /** Index of the image currently shown (kept in sync with the gallery). */
  index: number;
  name: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const ZOOM_SCALE = 2.5;

/**
 * Fullscreen product-image viewer.
 *
 * - Click the photo (or the zoom buttons) to zoom in / out.
 * - While zoomed, moving the pointer pans around the photo.
 * - Arrow keys / on-screen arrows switch photos, Escape closes.
 */
export default function ImageLightbox({
  images,
  index,
  name,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const total = images.length;
  const current = Math.min(Math.max(index, 0), total - 1);

  // Reset the zoom whenever the visible photo changes (render-time adjustment,
  // not an effect — avoids cascading renders).
  const [lastIndex, setLastIndex] = useState(current);
  if (lastIndex !== current) {
    setLastIndex(current);
    setZoomed(false);
    setOrigin("50% 50%");
  }

  const step = useCallback(
    (delta: number) => {
      if (total <= 1) return;
      onIndexChange((current + delta + total) % total);
    },
    [current, onIndexChange, total]
  );

  // Lock body scroll while the viewer is open. A ref tracks whether THIS
  // viewer owns the lock so a nested open/close can never restore "hidden"
  // and leave the whole site unscrollable.
  const lightboxLockRef = useRef(false);

  const applyLightboxLock = useCallback(() => {
    if (lightboxLockRef.current) return;
    const body = document.body;
    body.style.overflow = "hidden";
    lightboxLockRef.current = true;
  }, []);

  const releaseLightboxLock = useCallback(() => {
    if (!lightboxLockRef.current) return;
    document.body.style.overflow = "";
    lightboxLockRef.current = false;
  }, []);

  useEffect(() => {
    applyLightboxLock();
    closeRef.current?.focus();
    return () => {
      releaseLightboxLock();
    };
  }, [applyLightboxLock, releaseLightboxLock]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "+" || event.key === "=") setZoomed(true);
      else if (event.key === "-" || event.key === "_") setZoomed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, step]);

  const originFromEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return `${Math.min(100, Math.max(0, x)).toFixed(2)}% ${Math.min(100, Math.max(0, y)).toFixed(2)}%`;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    setOrigin(originFromEvent(event));
  };

  const toggleZoom = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) {
      setOrigin(originFromEvent(event));
      setZoomed(true);
    } else {
      // Keep the current origin so the photo shrinks in place smoothly.
      setZoomed(false);
    }
  };

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — fullscreen image viewer`}
    >
      <div className="lightbox-top" onClick={(e) => e.stopPropagation()}>
        <span className="lightbox-counter" aria-live="polite">
          {current + 1} / {total}
        </span>
        <div className="lightbox-actions">
          <button
            type="button"
            className="lightbox-btn"
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            aria-pressed={zoomed}
            onClick={() => setZoomed((z) => !z)}
          >
            {zoomed ? <ZoomOut size={19} strokeWidth={1.8} /> : <ZoomIn size={19} strokeWidth={1.8} />}
          </button>
          <button
            type="button"
            className="lightbox-btn"
            aria-label="Close viewer"
            onClick={onClose}
            ref={closeRef}
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {total > 1 && (
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            step(-1);
          }}
        >
          <ChevronLeft size={26} strokeWidth={1.8} />
        </button>
      )}

      <div
        ref={stageRef}
        className="lightbox-stage"
        // Only a click on the empty stage area (not the photo) closes the viewer.
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={`lightbox-image-wrap${zoomed ? " is-zoomed" : ""}`}
          role="button"
          tabIndex={0}
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
          aria-pressed={zoomed}
          onClick={toggleZoom}
          onMouseMove={handleMouseMove}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setZoomed((z) => !z);
            }
          }}
        >
          <Image
            key={images[current]}
            className="lightbox-zoom-img"
            src={images[current]}
            alt={`${name}${current > 0 ? ` — view ${current + 1}` : ""}`}
            fill
            sizes="100vw"
            style={{
              objectFit: "contain",
              transform: zoomed ? `scale(${ZOOM_SCALE})` : "scale(1)",
              transformOrigin: origin,
            }}
            priority
            draggable={false}
          />
        </div>
      </div>

      {total > 1 && (
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            step(1);
          }}
        >
          <ChevronRight size={26} strokeWidth={1.8} />
        </button>
      )}

      {!zoomed && (
        <button
          type="button"
          className="lightbox-hint"
          onClick={(e) => {
            e.stopPropagation();
            setOrigin("50% 50%");
            setZoomed(true);
          }}
        >
          Click the photo to zoom
        </button>
      )}
    </div>
  );
}
