import "server-only";

import { cache } from "react";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  STOREFRONT_SETTING_KEYS,
  type StorefrontSettings,
} from "@/data/settings";
import { getServiceClient } from "@/lib/admin/supabase";

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
    returnsText:
      values.get(STOREFRONT_SETTING_KEYS.returnsText)?.trim() ||
      DEFAULT_STOREFRONT_SETTINGS.returnsText,
  };
});
