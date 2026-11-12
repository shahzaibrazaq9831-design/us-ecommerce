import { getRatingSummaries } from "@/lib/reviews";

/**
 * The real rating of every piece that has approved reviews.
 *
 * Product cards need this on every page, so it is fetched once and kept
 * in memory by the provider. Only pieces with approved reviews are in
 * the answer — a piece with no approved review has no rating at all.
 */
export async function GET() {
  const ratings = await getRatingSummaries();

  return Response.json(
    { ratings },
    { headers: { "cache-control": "no-store" } }
  );
}
