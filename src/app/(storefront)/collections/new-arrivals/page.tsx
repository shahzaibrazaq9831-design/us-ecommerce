import { redirect } from "next/navigation";

/**
 * The new-arrivals collection moved to /new-arrivals. This route stays so the
 * older links keep working — it sends visitors (and search engines) to the
 * new home of the collection.
 */
export default function LegacyNewArrivalsPage() {
  redirect("/new-arrivals");
}
