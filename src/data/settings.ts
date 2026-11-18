/**
 * Defaults for the storefront settings stored in `site_settings`.
 *
 * This module is safe to import from both server and client code. Admin and
 * storefront reads fall back to these values when Supabase is unavailable or
 * a key has not been saved yet, so the shop never renders empty promises.
 */

import { ANNOUNCEMENT_TEXT } from "@/lib/offers";

export interface StorefrontSettings {
  /** Text shown in the scrolling announcement bar; `|` separates items. */
  announcementText: string;
  /** Returns policy. Lines beginning `## ` become headings in the UI. */
  returnsText: string;
}

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  announcementText: ANNOUNCEMENT_TEXT,
  returnsText: [
    "## Cancelling your order",
    "Changed your mind right after ordering? Contact us within 12 hours of placing your order and we will cancel it before it ships. Once an order has been dispatched it can no longer be cancelled.",
    "",
    "## Defective or damaged items",
    "If your item arrives defective or damaged, contact us with your order number and photos of the issue. After we verify it, we will offer a refund or a replacement — whichever you prefer.",
    "",
    "## No change-of-mind returns or exchanges",
    "Because our pieces are made to order, we do not offer change-of-mind returns, refunds or exchanges. Please double-check your size, colour and details before placing your order — see our Size Chart or contact us if you need help choosing.",
    "",
    "## Return shipping",
    "If you do need to return an item (for example, an approved defective or damaged item), the buyer pays the return shipping cost. We recommend using a tracked service.",
    "",
    "## Wrong address",
    "We are not responsible for non-delivery caused by an incorrect or incomplete shipping address entered at checkout, and no refund can be issued in that case. Please contact us as soon as you notice an address mistake — if the parcel has not shipped yet, we can update it.",
  ].join("\n"),
};

/** The `site_settings` keys that back the fields above. */
export const STOREFRONT_SETTING_KEYS = {
  announcementText: "announcement_bar_text",
  returnsText: "returns_text",
} as const;
