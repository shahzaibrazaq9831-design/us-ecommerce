"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageTransition from "@/components/admin/PageTransition";
import DataTable, { type DataColumn } from "@/components/admin/DataTable";
import { Modal } from "@/components/admin/Overlays";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/admin/Feedback";
import { useToast } from "@/components/admin/ToastProvider";
import { taxonomySchema } from "@/lib/admin/schema";
import { deleteTaxonomyAction, saveTaxonomyAction } from "@/actions/admin";
import { formatDate } from "@/lib/admin/format";
import type { AdminSnapshot, AdminTaxonomyItem } from "@/lib/admin/types";

type TaxonomyKind = "category" | "brand" | "occasion";

interface TaxonomySection {
  kind: TaxonomyKind;
  items: AdminTaxonomyItem[];
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

interface EditorState {
  kind: TaxonomyKind;
  item?: AdminTaxonomyItem;
}

interface DeleteState {
  kind: TaxonomyKind;
  item: AdminTaxonomyItem;
}

const EMPTY_FORM: FormState = { name: "", slug: "", description: "", imageUrl: "" };
const FORM_ID = "admin-taxonomy-form";

const LABELS: Record<TaxonomyKind, { singular: string; plural: string; hint: string }> = {
  category: {
    singular: "Category",
    plural: "Categories",
    hint: "Group dresses into categories shoppers can browse.",
  },
  brand: {
    singular: "Brand",
    plural: "Brands",
    hint: "Keep the labels your catalogue uses consistent.",
  },
  occasion: {
    singular: "Occasion",
    plural: "Occasions",
    hint: "Tag pieces for the events customers are shopping for.",
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function lower(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

export default function TaxonomyClient({
  sections,
  source,
  schemaNotice,
  title,
  eyebrow,
  description,
}: {
  sections: TaxonomySection[];
  source: AdminSnapshot["source"];
  schemaNotice: string | null;
  title: string;
  eyebrow: string;
  description?: string;
}) {
  const [activeKind, setActiveKind] = useState<TaxonomyKind>(sections[0]?.kind ?? "category");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<DeleteState | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const reduce = useReducedMotion();

  const showTabs = sections.length > 1;
  const activeSection = sections.find((section) => section.kind === activeKind) ?? sections[0];
  const kind = activeSection?.kind ?? "category";
  const labels = LABELS[kind];
  const items = activeSection?.items ?? [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.name, item.slug, item.description].some((value) =>
        value.toLowerCase().includes(needle)
      )
    );
  }, [items, query]);

  function switchSection(next: TaxonomyKind) {
    setActiveKind(next);
    setQuery("");
    setEditor(null);
    setDeleting(null);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setEditor({ kind });
  }

  function openEdit(item: AdminTaxonomyItem) {
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description,
      imageUrl: item.imageUrl,
    });
    setSlugTouched(true);
    setEditor({ kind, item });
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editor) return;

    const parsed = taxonomySchema.safeParse({ kind: editor.kind, ...form });
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Check the form.", "error");
      return;
    }

    setSaving(true);
    const result = await saveTaxonomyAction(parsed.data);
    setSaving(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(result.message, "success");
    setEditor(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    const result = await deleteTaxonomyAction(deleting.kind, deleting.item.slug);
    setDeletingBusy(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(result.message, "success");
    setDeleting(null);
    router.refresh();
  }

  const columns: DataColumn<AdminTaxonomyItem & { id: string }>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (row) => row.name,
      render: (row) => (
        <span className="admin-cell-stack">
          <strong>{row.name}</strong>
          <small>{row.description || "No description"}</small>
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortValue: (row) => row.slug,
      render: (row) => <span className="admin-mono">{row.slug}</span>,
      hideOnMobile: true,
    },
    {
      key: "products",
      header: "Products",
      align: "right",
      sortValue: (row) => row.productCount,
      render: (row) => (
        <span className={`admin-badge ${row.productCount ? "admin-badge--info" : "admin-badge--muted"}`}>
          {row.productCount} product{row.productCount === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Added",
      sortValue: (row) => row.createdAt,
      render: (row) => <span>{formatDate(row.createdAt)}</span>,
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <span>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={() => openEdit(row)}
            aria-label={`Edit ${row.name}`}
          >
            <Pencil size={14} /> Edit
          </button>{" "}
          <button
            type="button"
            className="admin-button admin-button--danger"
            onClick={() => setDeleting({ kind, item: row })}
            aria-label={`Delete ${row.name}`}
          >
            <Trash2 size={14} /> Delete
          </button>
        </span>
      ),
    },
  ];

  const rows = useMemo(() => filtered.map((item) => ({ ...item, id: item.slug })), [filtered]);
  const creating = Boolean(editor && !editor.item);

  return (
    <PageTransition>
      <div className="admin-page">
        <header className="admin-page-head">
          <div>
            <p className="admin-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="admin-subtitle">
              {items.length} {lower(labels.plural)} · source: {source}
            </p>
            {description ? <p className="admin-subtitle">{description}</p> : null}
          </div>
          <div className="admin-head-actions">
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={openAdd}
              disabled={!activeSection}
            >
              <Plus size={16} /> Add {lower(labels.singular)}
            </button>
          </div>
        </header>

        {schemaNotice ? (
          <div className="admin-alert admin-alert--warning" role="status">
            {schemaNotice}
          </div>
        ) : null}

        {showTabs ? (
          <div className="admin-filter-panel" role="tablist" aria-label="Catalogue taxonomy">
            {sections.map((section) => (
              <button
                key={section.kind}
                id={`taxonomy-tab-${section.kind}`}
                type="button"
                role="tab"
                aria-selected={activeKind === section.kind}
                aria-controls={`taxonomy-panel-${section.kind}`}
                className={`admin-button ${
                  activeKind === section.kind ? "admin-button--primary" : "admin-button--ghost"
                }`}
                onClick={() => switchSection(section.kind)}
              >
                {LABELS[section.kind].plural}
                <span className="admin-badge admin-badge--muted">{section.items.length}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div
          role={showTabs ? "tabpanel" : undefined}
          id={showTabs ? `taxonomy-panel-${kind}` : undefined}
          aria-labelledby={showTabs ? `taxonomy-tab-${kind}` : undefined}
        >
          {items.length ? (
            <>
              <section className="admin-filter-panel" aria-label={`Search ${lower(labels.plural)}`}>
                <label className="admin-field admin-field--grow">
                  <span className="admin-label">Search</span>
                  <span className="admin-input-icon">
                    <Search size={16} aria-hidden="true" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={`Search ${lower(labels.plural).toLowerCase()} by name or slug`}
                      aria-label={`Search ${lower(labels.plural)}`}
                    />
                  </span>
                </label>
              </section>

              <DataTable
                rows={rows}
                columns={columns}
                initialSort={{ key: "name", direction: "asc" }}
                emptyTitle={`No matching ${lower(labels.plural)}`}
                emptyDescription="Try a different search term."
              />
            </>
          ) : (
            <EmptyState
              title={`No ${lower(labels.plural)} yet`}
              description={labels.hint}
              action={
                <button type="button" className="admin-button admin-button--primary" onClick={openAdd}>
                  <Plus size={16} /> Add {lower(labels.singular)}
                </button>
              }
            />
          )}
        </div>

        <Modal
          open={Boolean(editor)}
          onClose={() => setEditor(null)}
          title={`${editor?.item ? "Edit" : "Add"} ${lower(labels.singular)}`}
          description={editor?.item ? "Changes apply across the catalogue." : labels.hint}
          footer={
            <>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form={FORM_ID}
                className="admin-button admin-button--primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          {editor ? (
            <motion.form
              id={FORM_ID}
              className="admin-form"
              onSubmit={submit}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              <label className="admin-field">
                <span className="admin-label">Name *</span>
                <input
                  className="admin-input"
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name,
                      slug: creating && !slugTouched ? slugify(name) : current.slug,
                    }));
                  }}
                  placeholder={`e.g. ${kind === "brand" ? "Gulshan Studios" : kind === "occasion" ? "Mehndi" : "Bridal"}`}
                  required
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Slug *</span>
                <input
                  className="admin-input"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update("slug", slugify(event.target.value));
                  }}
                  placeholder="my-new-item"
                  required
                />
                {creating ? (
                  <span className="admin-muted">
                    Generated from the name. You can change it before saving.
                  </span>
                ) : null}
              </label>
              <label className="admin-field">
                <span className="admin-label">Description</span>
                <textarea
                  className="admin-input admin-textarea"
                  rows={3}
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="A short description for this item."
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Image URL or path</span>
                <input
                  className="admin-input"
                  value={form.imageUrl}
                  onChange={(event) => update("imageUrl", event.target.value)}
                  placeholder="/images/bridal.jpg or https://…"
                />
                <span className="admin-muted">Leave blank if this item has no image yet.</span>
              </label>
            </motion.form>
          ) : null}
        </Modal>

        <ConfirmDialog
          open={Boolean(deleting)}
          title={`Delete ${deleting ? lower(LABELS[deleting.kind].singular) : "item"}`}
          message={
            deleting
              ? `Delete “${deleting.item.name}”? If products still use it, reassign them first.`
              : ""
          }
          pending={deletingBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void confirmDelete()}
        />
      </div>
    </PageTransition>
  );
}
