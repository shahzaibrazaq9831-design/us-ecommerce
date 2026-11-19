import { LoadingGrid, LoadingTable } from "@/components/admin/Feedback";

/** Shared loading state for every protected admin screen. */
export default function AdminLoading() {
  return (
    <div className="admin-page" aria-busy="true" aria-label="Loading admin data">
      <header className="admin-page-head">
        <div>
          <p className="admin-eyebrow">Damsa Coture</p>
          <h1>Loading…</h1>
          <p className="admin-subtitle">Reading the latest store data.</p>
        </div>
      </header>
      <LoadingGrid />
      <LoadingTable rows={5} />
    </div>
  );
}
