import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-session";
import { tryGetOrderById } from "@/lib/orders";
import InvoiceDocument from "@/components/admin/orders/InvoiceDocument";
import "./invoice.css";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * The browser header shows the document title, so the invoice route uses an
 * absolute title instead of the admin title template.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const safeId = typeof id === "string" && id.trim() ? id.trim() : "Order";

  return {
    title: { absolute: `Invoice ${safeId}` },
    robots: { index: false, follow: false },
  };
}

export default function AdminInvoicePage({ params }: Props) {
  return (
    <Suspense fallback={<div className="admin-panel admin-loading">Loading invoice…</div>}>
      <InvoicePanel params={params} />
    </Suspense>
  );
}

async function InvoicePanel({ params }: Props) {
  // The protected layout checks the session, and the route checks it again
  // before any order detail is read.
  await requireAdmin();

  const { id } = await params;
  const { order, error } = await tryGetOrderById(id);

  if (!order && !error) notFound();

  if (!order) {
    return (
      <div className="admin-panel">
        <p className="admin-alert admin-alert--warning" role="alert">
          {error ?? "We could not read that invoice."}
        </p>
        <p>
          <Link href="/admin/orders" className="admin-back">
            ← All orders
          </Link>
        </p>
      </div>
    );
  }

  return <InvoiceDocument order={order} />;
}
