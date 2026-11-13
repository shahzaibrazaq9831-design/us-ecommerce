import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-session";

/**
 * The protection around the admin screens.
 *
 * Everything inside this group — the orders list, an order, the order
 * actions — is behind the admin sign-in. A visitor who is not signed in is
 * sent to the sign-in page here, before a single order is read.
 *
 * The check is made here, at the top of the segment, so a signed-out
 * request is answered with a real redirect instead of a page that arrives
 * and then sends the visitor away a second later. The pages and the server
 * actions inside check the session again for themselves — a check in a
 * layout does not travel with a client-side navigation, and it never
 * protects an action.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The admin screens wait for a real request. Nothing here is prerendered
  // and cached: the session is read at request time, and the answer is
  // different for a signed-in admin and a signed-out visitor.
  await connection();

  await requireAdmin();

  return <>{children}</>;
}
