"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import PageTransition from "@/components/admin/PageTransition";
import { useToast } from "@/components/admin/ToastProvider";
import { saveSettingsAction } from "@/actions/admin";
import { settingsSchema, type SettingsInput } from "@/lib/admin/schema";
import type { AdminSettings, AdminSnapshot } from "@/lib/admin/types";

type FieldErrors = Partial<Record<keyof SettingsInput, string>>;

export default function SettingsClient({
  settings,
  source,
  schemaNotice,
}: {
  settings: AdminSettings;
  source: AdminSnapshot["source"];
  schemaNotice: string | null;
}) {
  const [form, setForm] = useState<SettingsInput>(() => ({ ...settings }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const reduce = useReducedMotion();

  const dirty = (Object.keys(form) as (keyof SettingsInput)[]).some(
    (key) => form[key] !== settings[key]
  );

  function update<K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = settingsSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key !== "string" || !(key in form)) continue;
        const field = key as keyof SettingsInput;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      toast(parsed.error.issues[0]?.message ?? "Check the settings form.", "error");
      return;
    }

    setErrors({});
    setSaving(true);
    const result = await saveSettingsAction(parsed.data);
    setSaving(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    setForm({ ...parsed.data });
    toast(result.message, "success");
    router.refresh();
  }

  return (
    <PageTransition>
      <div className="admin-page">
        <header className="admin-page-head">
          <div>
            <p className="admin-eyebrow">Damsa Coture</p>
            <h1>Settings</h1>
            <p className="admin-subtitle">
              Storefront details used across the shop · source: {source}
            </p>
          </div>
        </header>

        {schemaNotice ? (
          <div className="admin-notice" role="status">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{schemaNotice}</span>
          </div>
        ) : null}

        <form className="admin-form-grid" onSubmit={submit}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <section className="admin-panel">
              <header className="admin-card-head">
                <div>
                  <h2>Store details</h2>
                  <p>Contact information shown to customers</p>
                </div>
              </header>
              <div className="admin-field">
                <label className="admin-label" htmlFor="settings-store-name">
                  Store name *
                </label>
                <input
                  id="settings-store-name"
                  className="admin-input"
                  value={form.storeName}
                  onChange={(event) => update("storeName", event.target.value)}
                  aria-invalid={Boolean(errors.storeName)}
                  required
                />
                {errors.storeName ? (
                  <small className="admin-muted" role="alert">
                    {errors.storeName}
                  </small>
                ) : null}
              </div>
              <div className="admin-form-row">
                <div className="admin-field">
                  <label className="admin-label" htmlFor="settings-email">
                    Contact email *
                  </label>
                  <input
                    id="settings-email"
                    className="admin-input"
                    type="email"
                    value={form.contactEmail}
                    onChange={(event) => update("contactEmail", event.target.value)}
                    aria-invalid={Boolean(errors.contactEmail)}
                    required
                  />
                  {errors.contactEmail ? (
                    <small className="admin-muted" role="alert">
                      {errors.contactEmail}
                    </small>
                  ) : null}
                </div>
                <div className="admin-field">
                  <label className="admin-label" htmlFor="settings-phone">
                    Contact phone *
                  </label>
                  <input
                    id="settings-phone"
                    className="admin-input"
                    type="tel"
                    value={form.contactPhone}
                    onChange={(event) => update("contactPhone", event.target.value)}
                    aria-invalid={Boolean(errors.contactPhone)}
                    required
                  />
                  {errors.contactPhone ? (
                    <small className="admin-muted" role="alert">
                      {errors.contactPhone}
                    </small>
                  ) : null}
                </div>
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="settings-shipping">
                  Shipping information *
                </label>
                <textarea
                  id="settings-shipping"
                  className="admin-input admin-textarea"
                  rows={5}
                  value={form.shippingText}
                  onChange={(event) => update("shippingText", event.target.value)}
                  aria-invalid={Boolean(errors.shippingText)}
                  required
                />
                {errors.shippingText ? (
                  <small className="admin-muted" role="alert">
                    {errors.shippingText}
                  </small>
                ) : null}
              </div>
            </section>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <section className="admin-panel">
              <header className="admin-card-head">
                <div>
                  <h2>Storefront messages</h2>
                  <p>Announcement bar and returns policy</p>
                </div>
              </header>
              <div className="admin-field">
                <label className="admin-label" htmlFor="settings-announcement">
                  Announcement bar *
                </label>
                <textarea
                  id="settings-announcement"
                  className="admin-input admin-textarea"
                  rows={3}
                  value={form.announcementText}
                  onChange={(event) => update("announcementText", event.target.value)}
                  aria-invalid={Boolean(errors.announcementText)}
                  required
                />
                {errors.announcementText ? (
                  <small className="admin-muted" role="alert">
                    {errors.announcementText}
                  </small>
                ) : null}
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="settings-returns">
                  Returns policy *
                </label>
                <textarea
                  id="settings-returns"
                  className="admin-input admin-textarea"
                  rows={10}
                  value={form.returnsText}
                  onChange={(event) => update("returnsText", event.target.value)}
                  aria-invalid={Boolean(errors.returnsText)}
                  required
                />
                <small className="admin-muted">Lines starting with “## ” become headings.</small>
                {errors.returnsText ? (
                  <small className="admin-muted" role="alert">
                    {errors.returnsText}
                  </small>
                ) : null}
              </div>
            </section>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <section className="admin-panel">
              <header className="admin-card-head">
                <div>
                  <h2>Session &amp; security</h2>
                  <p>Read-only · managed on the server</p>
                </div>
                <ShieldCheck size={20} aria-hidden="true" />
              </header>
              <div className="admin-detail-grid">
                <span>
                  Access
                  <strong>Signed-in admins only</strong>
                </span>
                <span>
                  Session cookie
                  <strong>httpOnly · SameSite=Lax</strong>
                </span>
                <span>
                  Service key
                  <strong>Server-only, never sent to the browser</strong>
                </span>
                <span>
                  Every save
                  <strong>Re-checks the signed admin session</strong>
                </span>
              </div>
              <p className="admin-muted">
                Key values are read from the server environment at request time. No credentials or
                key values are shown on this screen.
              </p>
            </section>
          </motion.div>

          <div className="admin-form-actions">
            <span className="admin-muted">
              {dirty ? "You have unsaved changes." : "All changes saved."}
            </span>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => {
                setForm({ ...settings });
                setErrors({});
              }}
              disabled={saving || !dirty}
            >
              Reset
            </button>
            <button type="submit" className="admin-button admin-button--primary" disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
