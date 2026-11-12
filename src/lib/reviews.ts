/**
 * Reviews — the store behind every review on the site.
 *
 * This module owns three things and nothing else:
 *
 *   1. the records (a review, who wrote it, which piece it is about);
 *   2. the approval workflow — a new review is saved as "pending" and is
 *      never public until somebody approves it;
 *   3. the customer photos, which are checked on the server before they
 *      are written to disk.
 *
 * Storage is a JSON file under `.data/` so the store runs with no extra
 * packages and no database. When the real database arrives, replace the
 * four functions at the bottom of this file (`readRecords`,
 * `writeRecords`, `savePhotoFile`, `readPhotoFile`) and the rest of the
 * app keeps working — the same names, the same shapes.
 *
 * This module is server-only: it is imported by route handlers and by
 * server components, never by client components.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ALLOWED_PHOTO_TYPES,
  getProductBySlug,
  MAX_PHOTO_BYTES,
  MAX_REVIEW_LENGTH,
  MIN_REVIEW_LENGTH,
  summariseRatings,
  type ProductRatingSummary,
  type Review,
  type ReviewStatus,
} from "@/lib/products";
import { findOrderForReview } from "@/lib/orders";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/** A review as it is stored on disk. */
export interface ReviewRecord {
  id: string;
  /** The piece the review is about. */
  productSlug: string;
  /** 1–5 stars. */
  rating: number;
  text: string;
  /** The name the customer typed, or "" for an anonymous review. */
  name: string;
  /** Where the review is in the approval workflow. */
  status: ReviewStatus;
  /** ISO timestamp of when the review was written. */
  createdAt: string;
  /** The order the customer quoted, or "" when none was quoted. */
  orderId: string;
  /** True when the order really exists and contains this piece. */
  verified: boolean;
  /** File name of the customer photo, or "" when there is no photo. */
  photo: string;
  /** MIME type of the customer photo. */
  photoType: string;
}

/** The photo a customer attached to a review. */
export interface ReviewPhoto {
  data: Buffer;
  mimeType: string;
  /** The file name the customer sent, used only for its extension. */
  fileName?: string;
}

/** What the review form sends to the server. */
export interface ReviewInput {
  productSlug: string;
  rating: number;
  text: string;
  name?: string;
  orderId?: string;
  photo?: ReviewPhoto | null;
}

/** The answer the API gives back to the form. */
export type SubmitReviewResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/* ------------------------------------------------------------------ *
 * Limits
 *
 * The numbers live in `@/lib/products` so the form in the browser and
 * the check on the server read the same limits.
 * ------------------------------------------------------------------ */

export { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_REVIEW_LENGTH, MIN_REVIEW_LENGTH };

/* ------------------------------------------------------------------ *
 * Paths
 * ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), ".data");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const PHOTO_DIR = path.join(DATA_DIR, "review-photos");

/* ------------------------------------------------------------------ *
 * Reading and writing
 * ------------------------------------------------------------------ */

/** Every stored review. A missing or damaged file reads as no reviews. */
async function readRecords(): Promise<ReviewRecord[]> {
  try {
    const raw = await fs.readFile(REVIEWS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is ReviewRecord =>
        Boolean(entry) &&
        typeof (entry as ReviewRecord).id === "string" &&
        typeof (entry as ReviewRecord).productSlug === "string"
    );
  } catch {
    return [];
  }
}

/** Write the reviews back, replacing the file in one go. */
async function writeRecords(records: ReviewRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temporary = `${REVIEWS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(records, null, 2), "utf8");
  await fs.rename(temporary, REVIEWS_FILE);
}

/* ------------------------------------------------------------------ *
 * Photos
 * ------------------------------------------------------------------ */

/** The extension we store a photo under, from the bytes we received. */
function extensionForType(mimeType: string): string | null {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return null;
  }
}

/**
 * Look at the first bytes of the file and work out what it really is.
 * The browser's content type is a hint, not proof, so the server checks
 * the file itself before it is stored.
 */
export function detectImageType(data: Buffer): string | null {
  if (data.length < 12) return null;

  // JPEG — FF D8 FF
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG — 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSignature.every((byte, index) => data[index] === byte)) {
    return "image/png";
  }

  // WebP — "RIFF" .... "WEBP"
  if (
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

/** Write a customer photo to disk. */
async function savePhotoFile(id: string, photo: ReviewPhoto): Promise<string> {
  const extension = extensionForType(photo.mimeType) ?? ".bin";
  const fileName = `${id}${extension}`;

  await fs.mkdir(PHOTO_DIR, { recursive: true });
  await fs.writeFile(path.join(PHOTO_DIR, fileName), photo.data);

  return fileName;
}

/** Read a customer photo back. */
async function readPhotoFile(fileName: string): Promise<{
  data: Buffer;
  mimeType: string;
} | null> {
  // The file name comes from our own records, but never trust a path:
  // only the plain file name is used, never a directory.
  const safeName = path.basename(fileName);
  if (!safeName || safeName !== fileName) return null;

  try {
    const data = await fs.readFile(path.join(PHOTO_DIR, safeName));
    const mimeType = detectImageType(data) ?? "application/octet-stream";
    return { data, mimeType };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Public shape
 * ------------------------------------------------------------------ */

/** The photo URL for a stored review, or "" when it has no photo. */
export function reviewPhotoUrl(review: ReviewRecord): string {
  return review.photo ? `/api/reviews/photos/${review.id}` : "";
}

/** Turn a stored review into the shape the pages render. */
export function toPublicReview(review: ReviewRecord): Review {
  const product = getProductBySlug(review.productSlug);

  return {
    id: review.id,
    rating: review.rating,
    text: review.text,
    author: review.name.trim() || "Anonymous",
    verified: review.verified,
    date: review.createdAt.slice(0, 10),
    image: reviewPhotoUrl(review),
    product: product?.name ?? review.productSlug,
    productHref: product ? `/products/${product.slug}` : "/shop",
  };
}

/* ------------------------------------------------------------------ *
 * Reading reviews
 * ------------------------------------------------------------------ */

/** Every approved review, newest first. */
export async function listApprovedReviews(): Promise<Review[]> {
  const records = await readRecords();
  return records
    .filter((review) => review.status === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublicReview);
}

/** The approved reviews for one piece. */
export async function listApprovedReviewsForProduct(
  productSlug: string
): Promise<Review[]> {
  const records = await readRecords();
  return records
    .filter(
      (review) => review.status === "approved" && review.productSlug === productSlug
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublicReview);
}

/** The real rating of one piece — empty until approved reviews exist. */
export async function getRatingSummary(
  productSlug: string
): Promise<ProductRatingSummary> {
  const reviews = await listApprovedReviewsForProduct(productSlug);
  return summariseRatings(reviews);
}

/** The real rating of every piece that has approved reviews. */
export async function getRatingSummaries(): Promise<
  Record<string, ProductRatingSummary>
> {
  const records = await readRecords();
  const approved = records.filter((review) => review.status === "approved");

  const bySlug = new Map<string, number[]>();
  for (const review of approved) {
    const ratings = bySlug.get(review.productSlug) ?? [];
    ratings.push(review.rating);
    bySlug.set(review.productSlug, ratings);
  }

  const summaries: Record<string, ProductRatingSummary> = {};
  for (const [slug, ratings] of bySlug) {
    summaries[slug] = summariseRatings(ratings.map((rating) => ({ rating })));
  }

  return summaries;
}

/** The reviews waiting for approval. */
export async function listPendingReviews(): Promise<ReviewRecord[]> {
  const records = await readRecords();
  return records
    .filter((review) => review.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------------------------------------------ *
 * Writing reviews
 * ------------------------------------------------------------------ */

/**
 * Check a review before it is stored. Everything here runs on the server:
 * a form that is bypassed in the browser is still checked.
 */
export function validateReviewInput(
  input: ReviewInput
): { valid: true } | { valid: false; error: string } {
  const product = getProductBySlug(input.productSlug ?? "");
  if (!product) {
    return { valid: false, error: "That piece is not in the catalogue." };
  }

  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, error: "Choose a rating between 1 and 5 stars." };
  }

  const text = (input.text ?? "").trim();
  if (text.length < MIN_REVIEW_LENGTH) {
    return {
      valid: false,
      error: `Please write at least ${MIN_REVIEW_LENGTH} characters so your review helps other customers.`,
    };
  }
  if (text.length > MAX_REVIEW_LENGTH) {
    return {
      valid: false,
      error: `Please keep your review under ${MAX_REVIEW_LENGTH} characters.`,
    };
  }

  if (input.photo && input.photo.data.length > MAX_PHOTO_BYTES) {
    return {
      valid: false,
      error: "That photo is too large. Please upload an image of 5 MB or less.",
    };
  }

  return { valid: true };
}

/**
 * Save a new review. It is always saved as "pending" — nothing a
 * customer sends becomes public without a human approving it.
 */
export async function submitReview(input: ReviewInput): Promise<SubmitReviewResult> {
  const validation = validateReviewInput(input);
  if (!validation.valid) return { ok: false, error: validation.error };

  const product = getProductBySlug(input.productSlug);
  if (!product) return { ok: false, error: "That piece is not in the catalogue." };

  const id = crypto.randomUUID();
  const orderId = (input.orderId ?? "").trim();

  // A review is verified only when the order it quotes really exists and
  // really contains this piece. Anything else stays unverified.
  const order = await findOrderForReview(orderId, product.slug);

  let photo = "";
  let photoType = "";
  if (input.photo && input.photo.data.length > 0) {
    const detected = detectImageType(input.photo.data);
    if (!detected || !ALLOWED_PHOTO_TYPES.includes(detected as never)) {
      return {
        ok: false,
        error: "That photo is not a supported image. Please upload a JPG, PNG or WebP file.",
      };
    }
    photo = await savePhotoFile(id, { ...input.photo, mimeType: detected });
    photoType = detected;
  }

  const record: ReviewRecord = {
    id,
    productSlug: product.slug,
    rating: Number(input.rating),
    text: (input.text ?? "").trim(),
    name: (input.name ?? "").trim().slice(0, 60),
    status: "pending",
    createdAt: new Date().toISOString(),
    orderId: order ? order.id : "",
    verified: Boolean(order),
    photo,
    photoType,
  };

  const records = await readRecords();
  await writeRecords([...records, record]);

  return { ok: true, id };
}

/** Approve a review, which makes it public. */
export async function approveReview(id: string): Promise<boolean> {
  const records = await readRecords();
  const index = records.findIndex((review) => review.id === id);
  if (index === -1) return false;

  const next = [...records];
  next[index] = { ...next[index], status: "approved" };
  await writeRecords(next);

  return true;
}

/** Reject a review, which keeps it off the site. */
export async function rejectReview(id: string): Promise<boolean> {
  const records = await readRecords();
  const index = records.findIndex((review) => review.id === id);
  if (index === -1) return false;

  const next = [...records];
  next[index] = { ...next[index], status: "rejected" };
  await writeRecords(next);

  return true;
}

/** Read a stored customer photo back for serving. */
export async function readReviewPhoto(
  id: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  const records = await readRecords();
  const record = records.find((review) => review.id === id);
  if (!record || !record.photo) return null;

  return readPhotoFile(record.photo);
}
