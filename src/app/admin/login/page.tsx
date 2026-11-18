import type { Metadata } from "next";
import { Suspense } from "react";
import { adminEmail, isAdminConfigured } from "@/lib/admin-session";
import LoginPanel from "./LoginPanel";

export const metadata: Metadata = {
  title: "Sign in",
};

interface AdminLoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  return (
    <Suspense fallback={<div className="admin-login-page" />}>
      <LoginPanelWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPanelWrapper({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  return (
    <LoginPanel
      error={first(params.error)}
      next={first(params.next)}
      configured={isAdminConfigured()}
      email={adminEmail()}
    />
  );
}
