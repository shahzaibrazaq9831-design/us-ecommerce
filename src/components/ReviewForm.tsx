"use client";

import { useState } from "react";
import { Camera, Check, Star, X } from "lucide-react";
import { MAX_PHOTO_BYTES } from "@/lib/products";

interface ReviewFormProps {
  /** The pieces a customer can review — used on the reviews page. */
  products?: { slug: string; name: string }[];
  /** The piece being reviewed, when the form sits on a product page. */
  productSlug?: string;
}

/** The file types the form accepts — the server checks them again. */
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

/**
 * The form a customer uses to write a review.
 *
 * The review is sent to the server, which checks it and saves it as
 * pending. Nothing a customer writes appears on the site until it is
 * approved, so the form says so once it is sent.
 */
export default function ReviewForm({ products = [], productSlug }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [orderId, setOrderId] = useState("");
  const [slug, setSlug] = useState(productSlug ?? products[0]?.slug ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoError("");

    if (!file) {
      setPhoto(null);
      return;
    }

    if (!ACCEPTED_TYPES.split(",").includes(file.type)) {
      setPhoto(null);
      setPhotoError("Please choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setPhoto(null);
      setPhotoError("That photo is too large. Please choose an image of 5 MB or less.");
      return;
    }

    setPhoto(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!slug) {
      setStatus("error");
      setMessage("Please choose the piece you are reviewing.");
      return;
    }

    if (rating < 1) {
      setStatus("error");
      setMessage("Please choose a rating between 1 and 5 stars.");
      return;
    }

    setStatus("sending");
    setMessage("");

    const formData = new FormData();
    formData.set("productSlug", slug);
    formData.set("rating", String(rating));
    formData.set("text", text);
    formData.set("name", name);
    formData.set("orderId", orderId);
    if (photo) formData.set("photo", photo);

    try {
      const response = await fetch("/api/reviews", { method: "POST", body: formData });
      const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "We could not save your review. Please try again.");
        return;
      }

      setStatus("sent");
      setMessage(data.message ?? "Thank you — your review has been sent.");
      setRating(0);
      setName("");
      setText("");
      setOrderId("");
      setPhoto(null);
    } catch {
      setStatus("error");
      setMessage("We could not reach the server. Please check your connection and try again.");
    }
  };

  if (status === "sent") {
    return (
      <div className="review-form-done" role="status">
        <span className="review-form-done-icon" aria-hidden="true">
          <Check size={20} strokeWidth={2} />
        </span>
        <p className="review-form-done-title">Thank you for your review</p>
        <p className="review-form-done-copy">{message}</p>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setStatus("idle");
            setMessage("");
          }}
        >
          Write another review
        </button>
      </div>
    );
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <h3 className="review-form-title">Write a review</h3>

      {products.length > 0 && (
        <label className="review-form-field">
          <span className="review-form-label">Piece</span>
          <select
            className="review-form-select"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            required
          >
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="review-form-field">
        <span className="review-form-label" id="review-rating-label">
          Your rating
        </span>
        <div
          className="review-form-stars"
          role="radiogroup"
          aria-labelledby="review-rating-label"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = value <= (hovered || rating);
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                className={`review-form-star${filled ? " is-filled" : ""}`}
                onMouseEnter={() => setHovered(value)}
                onFocus={() => setHovered(value)}
                onBlur={() => setHovered(0)}
                onClick={() => setRating(value)}
              >
                <Star size={26} strokeWidth={1.6} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <label className="review-form-field">
        <span className="review-form-label">Your review</span>
        <textarea
          className="review-form-textarea"
          rows={5}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="How did it fit? How was the fabric? Would you order again?"
          required
          minLength={10}
          maxLength={2000}
        />
        <span className="review-form-hint">
          At least 10 characters. Reviews are checked before they appear.
        </span>
      </label>

      <label className="review-form-field">
        <span className="review-form-label">Your name (optional)</span>
        <input
          className="review-form-input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Leave this empty to post anonymously"
          maxLength={60}
        />
        <span className="review-form-hint">
          Leave it empty and your review shows as Anonymous.
        </span>
      </label>

      <label className="review-form-field">
        <span className="review-form-label">Order number (optional)</span>
        <input
          className="review-form-input"
          type="text"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder="Only if you have one — it marks your review as verified"
          maxLength={40}
        />
        <span className="review-form-hint">
          Your review is only marked &ldquo;Verified purchase&rdquo; when the order
          number matches a real order for this piece.
        </span>
      </label>

      <div className="review-form-field">
        <span className="review-form-label">Photo (optional)</span>
        <label className="review-form-upload">
          <Camera size={18} strokeWidth={1.7} aria-hidden="true" />
          <span>{photo ? photo.name : "Choose an image"}</span>
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handlePhoto}
            aria-label="Add a photo to your review"
          />
        </label>
        {photo && (
          <button
            type="button"
            className="review-form-upload-clear"
            onClick={() => setPhoto(null)}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" /> Remove photo
          </button>
        )}
        <span className="review-form-hint">
          JPG, PNG or WebP, up to 5 MB. The photo is checked on the server.
        </span>
        {photoError && (
          <span className="review-form-error" role="alert">
            {photoError}
          </span>
        )}
      </div>

      {message && status === "error" && (
        <p className="review-form-error" role="alert">
          {message}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary review-form-submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send review"}
      </button>

      <p className="review-form-note">
        Reviews are checked by our team before they appear on the site.
      </p>
    </form>
  );
}
