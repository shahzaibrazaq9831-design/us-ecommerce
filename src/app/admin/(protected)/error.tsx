"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/admin/Feedback";

/** Route-level fallback. It never exposes server error details to the browser. */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Studio</p>
          <h1>Something went wrong</h1>
          <p className="admin-subtitle">The page could not be loaded.</p>
        </div>
      </header>
      <ErrorState message="Check the connection to Supabase and try again." />
      <div>
        <button type="button" className="admin-button admin-button--primary" onClick={retry}>
          Try again
        </button>
      </div>
    </div>
  );
}
