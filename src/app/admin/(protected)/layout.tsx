import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-session";
import AdminShell from "@/components/admin/AdminShell";
import AdminLoading from "./loading";

/**
 * The gate around every studio screen. A signed-out visitor is redirected
 * by `requireAdmin()` before any data is read. Every server action checks
 * the session again for itself.
 *
 * The session read sits behind a Suspense boundary rather than at the top of
 * the layout, so the shell can stream while the cookie and clock are checked.
 */
export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProtectedAdminContent>{children}</ProtectedAdminContent>
    </Suspense>
  );
}

async function ProtectedAdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
