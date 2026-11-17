"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  EyeOff,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import PageTransition from "@/components/admin/PageTransition";
import StatCard from "@/components/admin/StatCard";
import { EmptyState } from "@/components/admin/Feedback";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";
import { deleteReviewAction, moderateReviewAction } from "@/actions/admin";
import { formatDateTime } from "@/lib/admin/format";
import type { AdminReview, AdminSnapshot } from "@/lib/admin/types";

type StatusFilter = "all" | AdminReview["status"];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "hidden", label: "Hidden" },
];

const MODERATION_OPTIONS: {
  status: AdminReview["status"];
  label: string;
  icon: ReactNode;
}[] = [
  { status: "approved", label: "Approve", icon: <Check size={14} /> },
  { status: "pending", label: "Pending", icon: <RotateCcw size={14} /> },
  { status: "hidden", label: "Hide", icon: <EyeOff size={14} /> },
];

export default function ReviewsClient({
  reviews,
  source,
  schemaNotice,
}: {
  reviews: AdminReview[];
  source: AdminSnapshot["source"];
  schemaNotice: string | null;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [override, setOverride] = useState<{
    id: string;
    status: AdminReview["status"];
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const reduce = useReducedMotion();

  // Moderation is safe to preview locally: the server rechecks the session and
  // validates the status, and this preview is dropped if the write is rejected.
  const visibleReviews = useMemo(
    () =>
      override
        ? reviews.map((review) =>
            review.id === override.id ? { ...review, status: override.status } : review
          )
        : reviews,
    [reviews, override]
  );

  if (
    override &&
    reviews.some((review) => review.id === override.id && review.status === override.status)
  ) {
    setOverride(null);
  }

  const counts = useMemo(
    () => ({
      all: visibleReviews.length,
      pending: visibleReviews.filter((review) => review.status === "pending").length,
      approved: visibleReviews.filter((review) => review.status === "approved").length,
      hidden: visibleReviews.filter((review) => review.status === "hidden").length,
    }),
    [visibleReviews]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return visibleReviews.filter((review) => {
      if (status !== "all" && review.status !== status) return false;
      if (!needle) return true;
      return [review.author, review.productName, review.text, review.orderId].some((value) =>
        value.toLowerCase().includes(needle)
      );
    });
  }, [visibleReviews, status, query]);

  async function moderate(review: AdminReview, next: AdminReview["status"]) {
    if (review.status === next || busyId) return;
    setBusyId(review.id);
    setOverride({ id: review.id, status: next });
    const result = await moderateReviewAction(review.id, next);
    setBusyId("");
    if (!result.ok) {
      setOverride(null);
      toast(result.error, "error");
      return;
    }
    toast(result.message, "success");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteReviewAction(deleteTarget.id);
    setDeleting(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    setDeleteTarget(null);
    toast(result.message, "success");
    router.refresh();
  }

  const cards = [
    {
      label: "Pending",
      value: counts.pending,
      icon: <TriangleAlert size={19} />,
      hint: "Waiting for moderation",
      tone: "rose" as const,
    },
    {
      label: "Approved",
      value: counts.approved,
      icon: <Check size={19} />,
      hint: "Visible to shoppers",
      tone: "green" as const,
    },
    {
      label: "Hidden",
      value: counts.hidden,
      icon: <EyeOff size={19} />,
      hint: "Removed from display",
      tone: "blue" as const,
    },
  ];

  return (
    <PageTransition>
      <div className="admin-page">
        <header className="admin-page-head">
          <div>
            <p className="admin-eyebrow">Community</p>
            <h1>Reviews</h1>
            <p className="admin-subtitle">
              {visibleReviews.length} review{visibleReviews.length === 1 ? "" : "s"} · source: {source}
            </p>
          </div>
          <div className="admin-head-actions">
            <div className="admin-segmented" role="group" aria-label="Review status">
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={status === option.value ? "is-active" : ""}
                  onClick={() => setStatus(option.value)}
                  aria-pressed={status === option.value}
                >
                  {option.label} ({counts[option.value]})
                </button>
              ))}
            </div>
          </div>
        </header>

        {schemaNotice ? (
          <div className="admin-notice" role="status">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{schemaNotice}</span>
          </div>
        ) : null}

        <div className="admin-stat-grid">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <section className="admin-filter-panel">
          <label className="admin-field admin-field--grow">
            <span className="admin-label">Search</span>
            <span className="admin-input-icon">
              <Search size={16} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Author, product, order or review text"
                aria-label="Search reviews"
              />
            </span>
          </label>
          {query ? (
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => setQuery("")}
            >
              <X size={15} /> Clear
            </button>
          ) : null}
        </section>

        <motion.section
          className="admin-panel"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <header className="admin-card-head">
            <div>
              <h2>{status === "all" ? "All reviews" : `${status[0].toUpperCase()}${status.slice(1)} reviews`}</h2>
              <p>{filtered.length} shown · moderation changes take effect immediately</p>
            </div>
          </header>

          {filtered.length ? (
            <ul className="admin-order-items">
              {filtered.map((review) => {
                const rating = Math.max(0, Math.min(5, review.rating));
                return (
                  <motion.li
                    key={review.id}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="admin-order-item-image" aria-hidden="true">
                      {review.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={review.photoUrl} alt="" loading="lazy" />
                      ) : (
                        "—"
                      )}
                    </span>
                    <span className="admin-order-item-copy">
                      <span className="admin-badge-row">
                        <span className="admin-review-stars" aria-label={`${rating} out of 5 stars`}>
                          {"★".repeat(rating)}
                          <span>{rating}/5</span>
                        </span>
                        <span className={`admin-status-chip is-${review.status}`}>
                          {review.status}
                        </span>
                        {review.verified ? (
                          <span className="admin-mini-badge is-best">
                            <ShieldCheck size={12} aria-hidden="true" /> Verified purchase
                          </span>
                        ) : null}
                      </span>
                      <span>“{review.text}”</span>
                      <small>
                        {review.author} · {review.productName} · {formatDateTime(review.createdAt)}
                        {review.orderId ? ` · Order ${review.orderId}` : ""}
                      </small>
                      <span className="admin-form-actions">
                        {MODERATION_OPTIONS.map((option) => (
                          <button
                            key={option.status}
                            type="button"
                            className={`admin-button admin-button--${
                              option.status === "approved" ? "primary" : "ghost"
                            }`}
                            disabled={review.status === option.status || Boolean(busyId)}
                            onClick={() => void moderate(review, option.status)}
                          >
                            {option.icon} {option.label}
                          </button>
                        ))}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="admin-icon-button"
                      disabled={Boolean(busyId)}
                      onClick={() => setDeleteTarget(review)}
                      aria-label={`Delete review by ${review.author}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title={
                visibleReviews.length === 0
                  ? "No reviews yet"
                  : status === "all"
                    ? "No matching reviews"
                    : `No ${status} reviews`
              }
              description={
                visibleReviews.length === 0
                  ? "Customer reviews will appear here once they are submitted."
                  : "Try another status or clear your search to see more reviews."
              }
            />
          )}
        </motion.section>

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete review?"
          message={
            deleteTarget
              ? `Delete the review from ${deleteTarget.author} for ${deleteTarget.productName}? This cannot be undone.`
              : ""
          }
          pending={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      </div>
    </PageTransition>
  );
}
