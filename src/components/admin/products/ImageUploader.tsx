"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GripVertical, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useToast } from "@/components/admin/ToastProvider";

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (images: string[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const reduce = useReducedMotion();

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of list) {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "product");
      try {
        const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
        const data = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !data.url) throw new Error(data.error ?? "Upload failed");
        uploaded.push(data.url);
      } catch (error) {
        toast(error instanceof Error ? error.message : "Upload failed", "error");
      }
    }
    setUploading(false);
    if (uploaded.length) {
      onChange([...value, ...uploaded]);
      toast(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded.`, "success");
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="admin-uploader">
      <div
        className={`admin-upload-drop ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files);
            event.target.value = "";
          }}
        />
        {uploading ? <Loader2 className="admin-spin" size={24} /> : <UploadCloud size={24} />}
        <p>Drag images here or choose files</p>
        <button type="button" className="admin-link-button" onClick={() => inputRef.current?.click()}>
          Browse images
        </button>
        <small>JPG, PNG, WebP or AVIF · up to 10 MB each</small>
      </div>

      {value.length ? (
        <div className="admin-upload-grid">
          <AnimatePresence initial={false}>
            {value.map((url, index) => (
              <motion.div
                key={`${url}-${index}`}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="admin-upload-item"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Product image ${index + 1}`} />
                <span className="admin-upload-order">{index + 1}</span>
                <div className="admin-upload-controls">
                  <button type="button" title="Move left" onClick={() => move(index, index - 1)}>
                    ←
                  </button>
                  <button type="button" title="Move right" onClick={() => move(index, index + 1)}>
                    →
                  </button>
                  <button
                    type="button"
                    title="Remove image"
                    onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <GripVertical size={14} className="admin-upload-grip" aria-hidden="true" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="admin-upload-empty">
          <ImagePlus size={18} /> No images yet — the first one becomes the cover.
        </div>
      )}
    </div>
  );
}
