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

/** Full URL for a path on this site. */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
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
