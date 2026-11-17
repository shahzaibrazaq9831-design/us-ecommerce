import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import AdminShell from "@/components/admin/AdminShell";

/**
 * The gate around every studio screen. A signed-out visitor is redirected
 * by `requireAdmin()` before any data is read. Every server action checks
 * the session again for itself.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await requireAdmin();

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
