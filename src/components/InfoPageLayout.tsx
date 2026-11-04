import Link from "next/link";
import type { ReactNode } from "react";

interface InfoPageLayoutProps {
  /** Page heading (rendered as h1). */
  title: string;
  /** One-line summary shown under the heading. */
  intro: string;
  /** Page sections — use <section className="info-section"> blocks. */
  children: ReactNode;
}

/**
 * Shared layout for the simple policy/info pages
 * (/shipping, /returns, /made-to-order, /support):
 * centred title, short intro, content sections and a "Contact us" button.
 */
export default function InfoPageLayout({
  title,
  intro,
  children,
}: InfoPageLayoutProps) {
  return (
    <section className="section info-page">
      <div className="container info-page-container">
        <div className="section-header info-page-header">
          <h1 className="section-title">{title}</h1>
          <p className="section-subtitle">{intro}</p>
        </div>

        <div className="info-page-body">{children}</div>

        <div className="info-page-cta">
          <Link href="/contact" className="btn btn-primary">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
