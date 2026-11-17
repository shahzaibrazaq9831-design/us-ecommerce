import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import CustomersClient from "@/components/admin/customers/CustomersClient";

export const metadata: Metadata = {
  title: "Customers",
  description: "Customers aggregated from recorded store orders.",
};

export default async function AdminCustomersPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();

  return (
    <CustomersClient
      customers={snapshot.customers}
      source={snapshot.source}
      schemaNotice={snapshot.schemaNotice}
    />
  );
}
