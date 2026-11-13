import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAdminSession } from "@/lib/admin-session";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  // The admin screens are never for a search engine.
  robots: { index: false, follow: false },
};

/**
 * The admin screens wait for the server on every visit.
 *
 * Every one of them reads the session, and a signed-out visitor has to be
 * sent to the sign-in page with a real redirect — not with a page that
 * arrives and then refreshes itself a second later. Opting this segment out
 * of instant navigation keeps the whole admin area blocking on the server.
 */
export const instant = false;

/**
 * The admin shell. It wraps every screen under /admin — the sign-in page
 * as well as the orders — so the admin area always looks the same and the
 * storefront header and footer step aside for it.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <div className="admin-bar-inner">
          <Link href="/admin/orders" className="admin-brand">
            <span className="admin-brand-mark" aria-hidden="true">
              SB
            </span>
            <span className="admin-brand-name">Studio Admin</span>
          </Link>
          <nav className="admin-nav" aria-label="Admin sections">
            <Link href="/admin/orders" className="admin-nav-link">
              Orders
            </Link>
          </nav>
          <Suspense fallback={<div className="admin-session" />}>
            <AdminSessionBar />
          </Suspense>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}

/**
 * Who is signed in, and the button that signs them out. It reads the
 * session, so it sits behind a Suspense boundary in the layout above.
 */
async function AdminSessionBar() {
  const session = await getAdminSession();

  if (!session) {
    return (
      <div className="admin-session">
        <Link href="/admin/login" className="admin-button admin-button--ghost">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-session">
      <span className="admin-session-email">{session.email}</span>
      <form action={signOutAction}>
        <button type="submit" className="admin-button admin-button--ghost">
          Sign out
        </button>
      </form>
    </div>
  );
}
