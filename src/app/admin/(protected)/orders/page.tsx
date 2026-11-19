import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import { tryListStoredOrders } from "@/lib/orders";
import { toOrderDetail } from "@/lib/admin/data";
import { LoadingTable } from "@/components/admin/Feedback";
import OrdersClient from "@/components/admin/orders/OrdersClient";

export const metadata: Metadata = { title: "Orders" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function AdminOrdersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<LoadingTable />}>
      <OrdersPanel searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersPanel({ searchParams }: Props) {
  await requireAdmin();
  const [snapshot, ordersResult, params] = await Promise.all([
    getAdminSnapshot(),
    tryListStoredOrders(),
    searchParams,
  ]);

  return (
    <OrdersClient
      orders={snapshot.orders}
      details={ordersResult.orders.map(toOrderDetail)}
      source={snapshot.source}
      schemaNotice={snapshot.schemaNotice}
      initialOrder={first(params.order)}
    />
  );
}
