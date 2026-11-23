"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Toast() {
  const { toast, dismissToast } = useCart();
  if (!toast) return null;

  return (
    <div className="toast show" role="status" aria-live="polite">
      <i className="fas fa-check-circle" aria-hidden="true" />
      <span>{toast.message}</span>
      {toast.action ? (
        <Link
          className="toast__action"
          href={toast.action.href}
          onClick={dismissToast}
        >
          {toast.action.label}
        </Link>
      ) : null}
    </div>
  );
}
