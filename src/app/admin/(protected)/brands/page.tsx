import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import TaxonomyClient from "@/components/admin/taxonomy/TaxonomyClient";

export const metadata: Metadata = { title: "Brands & occasions" };

export default async function AdminBrandsPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();

  return (
    <TaxonomyClient
      title="Brands & occasions"
      eyebrow="Catalogue"
      description="Manage the brands and occasions used across the catalogue."
      sections={[
        { kind: "brand", items: snapshot.brands },
        { kind: "occasion", items: snapshot.occasions },
      ]}
      source={snapshot.source}
      schemaNotice={snapshot.schemaNotice}
    />
  );
}
