/**
 * Seller details for the admin invoice.
 *
 * Keep every editable invoice brand value here so the address, phone and
 * support wording only need changing in one place. The logo and the contact
 * details already used by the storefront are reused rather than duplicated.
 */

import { siteConfig } from "@/data/site";
import { SITE_URL } from "@/lib/seo";

export const invoiceBrand = {
  /** The wordmark shown above the seller details. */
  name: siteConfig.company,
  /** Reused from the storefront header, footer and admin sidebar. */
  logo: "/images/logo-damsa.webp",
  /**
   * Replace these lines with the studio's real postal address.
   * Each entry prints on its own line, so leave an entry empty to omit it.
   */
  address: [
    "ADD SELLER STREET ADDRESS",
    "ADD CITY, STATE AND POSTAL CODE",
    "ADD COUNTRY",
  ],
  /** Already set in src/data/site.ts. */
  phone: siteConfig.phone,
  /** Already set in src/data/site.ts. */
  email: siteConfig.email,
  /** Uses NEXT_PUBLIC_SITE_URL when it is set. */
  website: SITE_URL,
  /** Used in the footer of the invoice. */
  supportEmail: siteConfig.email,
  /** Keep this short enough to fit on one line of the invoice footer. */
  returnsLine:
    "Returns and exchanges are accepted for defective or damaged items only. Made-to-order pieces cannot be exchanged.",
};

/** Drops empty, duplicated or whitespace-only lines before printing. */
export function cleanAddressLines(lines: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();

  return lines.reduce<string[]>((result, line) => {
    const value = typeof line === "string" ? line.trim() : "";
    if (!value || seen.has(value)) return result;
    seen.add(value);
    result.push(value);
    return result;
  }, []);
}
