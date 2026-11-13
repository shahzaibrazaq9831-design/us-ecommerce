/**
 * SEO helpers — one place for the site URL, the page titles and the
 * canonical/Open Graph metadata every page shares.
 *
 * The site URL is a placeholder: change `SITE_URL` once and every canonical
 * link, sitemap entry and social card follows.
 */

import type { Metadata } from "next";

/** The live address of the shop. Change this when the domain changes. */
export const SITE_URL = "https://www.rungebahar.com";

/** Shop name used in titles and structured data. */
export const SITE_NAME = "Rung E Bahar";

/**
 * Is this request coming from a local machine?
 *
 * A cookie marked "secure" is not sent over plain http, which would
 * break the order confirmation on a laptop running the shop locally.
 * On the real site the request is always https, so the cookie is
 * marked secure there.
 */
export function isLocalRequest(request: Request): boolean {
  const host = (request.headers.get("host") ?? "").toLowerCase();

  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]") ||
    host.startsWith("0.0.0.0")
  );
}

/** Full URL for a path on this site. */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The address of the site this request came to.
 *
 * The request is the truth about where a visitor is — a preview
 * deployment, a staging host, the live site — so links that have to
 * point back at the shop (a payment page, a confirmation email) are
 * built from this. The site's own address is the fallback.
 */
export function baseUrlFromRequest(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  const host = request.headers.get("host");

  if (host) {
    const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwarded || (host.startsWith("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return SITE_URL.replace(/\/+$/, "");
}

interface PageMetaInput {
  /** Page title without the shop name. */
  title: string;
  description: string;
  /** Path of this page, used for the canonical URL. */
  path: string;
  /** Social card image — defaults to the site-wide one. */
  image?: string;
  /** Keeps a page out of search results (account, checkout, cart). */
  noIndex?: boolean;
}

/**
 * Build the metadata for a page: title, description, canonical URL and the
 * Open Graph / Twitter card.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: "en_GB",
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
