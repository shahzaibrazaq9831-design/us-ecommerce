import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
};

/** The admin screens wait for the server so session checks stay authoritative. */
export const instant = false;

/**
 * The sign-in page and the protected studio both live under /admin, so the
 * chrome belongs to the protected segment only. This layout stays silent.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
