import type { NextRequest } from "next/server";
import { normalizeMarketCode } from "@/lib/markets";

/**
 * Best-effort visitor country lookup for the region auto-detection.
 *
 * Uses the geo headers the hosting platform injects (Vercel's
 * `x-vercel-ip-country`, Cloudflare's `cf-ipcountry`). The country is
 * normalized to one of the store's price markets and returned as
 * `{ regionCode }`; `null` means "unknown" so the client falls back to
 * the United States — the same contract as the live site.
 */
export async function GET(request: NextRequest) {
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code") ??
    "";

  const regionCode = country.trim() ? normalizeMarketCode(country) : "";
  return Response.json({ regionCode: regionCode || null });
}
