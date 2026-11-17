import { requireAdminApi } from "@/lib/admin/api-auth";
import { getServiceClient } from "@/lib/admin/supabase";
import { uploadSchema } from "@/lib/admin/schema";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/** Uploads go straight from this server route to Supabase Storage. */
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const client = getServiceClient();
  if (!client) {
    return Response.json({ error: "Supabase service key is not configured." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Could not read the upload." }, { status: 400 });
  }

  const kind = uploadSchema.safeParse({ kind: form.get("kind") ?? "product" });
  if (!kind.success) {
    return Response.json({ error: "Unknown upload type." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { error: "Use a JPG, PNG, WebP or AVIF image." },
      { status: 415 }
    );
  }

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const bucket = kind.data.kind === "product" ? "product-images" : "review-photos";
  const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await client.storage.from(bucket).upload(safeName, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data } = client.storage.from(bucket).getPublicUrl(safeName);
  return Response.json({ url: data.publicUrl }, { status: 201 });
}
