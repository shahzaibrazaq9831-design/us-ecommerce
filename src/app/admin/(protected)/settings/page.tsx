import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import SettingsClient from "@/components/admin/settings/SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description: "Contact and shipping settings for the shop.",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();

  return (
    <SettingsClient
      settings={snapshot.settings}
      source={snapshot.source}
      schemaNotice={snapshot.schemaNotice}
    />
  );
}
