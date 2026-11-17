"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

function useOverlay(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("admin-body-lock");
    const focusTimer = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>("button, input, select, textarea, a")?.focus();
    }, 80);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panel.current) return;

      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("admin-body-lock");
      previous?.focus();
    };
  }, [open, onClose]);

  return panel;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const panel = useOverlay(open, onClose);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="admin-modal-overlay"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panel}
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="admin-drawer-head">
              <div>
                <h2>{title}</h2>
                {description ? <p>{description}</p> : null}
              </div>
              <button
                type="button"
                className="admin-icon-button"
                onClick={onClose}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </header>
            <div className="admin-drawer-body">{children}</div>
            {footer ? <footer className="admin-drawer-foot">{footer}</footer> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const reduce = useReducedMotion();
  const panel = useOverlay(open, onClose);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="admin-modal-overlay"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panel}
            className={`admin-modal ${wide ? "admin-modal--wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? false : { opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 32 }}
          >
            <header className="admin-modal-head">
              <div>
                <h2>{title}</h2>
                {description ? <p>{description}</p> : null}
              </div>
              <button
                type="button"
                className="admin-icon-button"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </header>
            <div className="admin-modal-body">{children}</div>
            {footer ? <footer className="admin-modal-foot">{footer}</footer> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
