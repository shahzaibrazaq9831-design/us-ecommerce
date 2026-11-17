import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import { LoadingTable } from "@/components/admin/Feedback";
import ProductsClient from "@/components/admin/products/ProductsClient";

export const metadata: Metadata = { title: "Products" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function AdminProductsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<LoadingTable />}>
      <ProductsPanel searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsPanel({ searchParams }: Props) {
  await requireAdmin();
  const [snapshot, params] = await Promise.all([getAdminSnapshot(), searchParams]);

  return (
    <ProductsClient
      snapshot={snapshot}
      initialProduct={first(params.product)}
    />
  );
}
