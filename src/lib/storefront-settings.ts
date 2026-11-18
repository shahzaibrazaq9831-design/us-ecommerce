import "server-only";

import { cache } from "react";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  STOREFRONT_SETTING_KEYS,
  type StorefrontSettings,
} from "@/data/settings";
import { getServiceClient } from "@/lib/admin/supabase";

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

function readPercent(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 100
    ? Math.round(parsed)
    : fallback;
}

function readEndDate(value: string | undefined): string {
  if (!value?.trim()) return "";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

/**
 * Storefront-facing settings, read on the server with the service key.
 *
 * This never throws: a missing table, a network error or an unset key simply
 * falls back to the checked-in defaults so a marketing setting can never take
 * the storefront down.
 */
export const getStorefrontSettings = cache(async (): Promise<StorefrontSettings> => {
  const client = getServiceClient();
  if (!client) return DEFAULT_STOREFRONT_SETTINGS;

  const keys = Object.values(STOREFRONT_SETTING_KEYS);
  const { data, error } = await client
    .from("site_settings")
    .select("key,value")
    .in("key", [...keys]);

  if (error || !data) return DEFAULT_STOREFRONT_SETTINGS;

  const values = new Map(data.map((row) => [row.key, row.value]));

  return {
    announcementText:
      values.get(STOREFRONT_SETTING_KEYS.announcementText)?.trim() ||
      DEFAULT_STOREFRONT_SETTINGS.announcementText,
    offerEnabled: readBoolean(
      values.get(STOREFRONT_SETTING_KEYS.offerEnabled),
      DEFAULT_STOREFRONT_SETTINGS.offerEnabled
    ),
    offerEndDate: readEndDate(values.get(STOREFRONT_SETTING_KEYS.offerEndDate)),
    discountCode:
      values.get(STOREFRONT_SETTING_KEYS.discountCode)?.trim().toUpperCase() ||
      DEFAULT_STOREFRONT_SETTINGS.discountCode,
    discountPercent: readPercent(
      values.get(STOREFRONT_SETTING_KEYS.discountPercent),
      DEFAULT_STOREFRONT_SETTINGS.discountPercent
    ),
    returnsText:
      values.get(STOREFRONT_SETTING_KEYS.returnsText)?.trim() ||
      DEFAULT_STOREFRONT_SETTINGS.returnsText,
  };
});
