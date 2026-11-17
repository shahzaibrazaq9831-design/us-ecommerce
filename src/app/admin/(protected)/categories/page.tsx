import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import TaxonomyClient from "@/components/admin/taxonomy/TaxonomyClient";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();

  return (
    <TaxonomyClient
      title="Categories"
      eyebrow="Catalogue"
      description="Group dresses into categories shoppers can browse."
      sections={[{ kind: "category", items: snapshot.categories }]}
      source={snapshot.source}
      schemaNotice={snapshot.schemaNotice}
    />
  );
}
