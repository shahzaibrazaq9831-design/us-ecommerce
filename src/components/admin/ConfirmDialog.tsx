"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Overlays";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  pending = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button type="button" className="admin-button admin-button--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-button admin-button--danger"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="admin-confirm">
        <span className="admin-confirm-icon" aria-hidden="true">
          <AlertTriangle size={24} />
        </span>
        <p>{message}</p>
      </div>
    </Modal>
  );
}
