import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  submitReview,
  type ReviewPhoto,
} from "@/lib/reviews";

/**
 * Take a new review from the form.
 *
 * Everything is checked here, on the server: the piece has to exist, the
 * rating has to be between one and five stars, the text has to be long
 * enough, and a photo has to be a real image of an allowed type and
 * size. The browser's word is never taken on trust.
 *
 * A review that passes these checks is saved as "pending" — it is not
 * public until somebody approves it.
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { ok: false, error: "We could not read that review. Please try again." },
      { status: 400 }
    );
  }

  const productSlug = String(formData.get("productSlug") ?? "").trim();
  const rating = Number(formData.get("rating") ?? "");
  const text = String(formData.get("text") ?? "");
  const name = String(formData.get("name") ?? "");
  const orderId = String(formData.get("orderId") ?? "");

  let photo: ReviewPhoto | null = null;
  const photoEntry = formData.get("photo");

  if (photoEntry instanceof File && photoEntry.size > 0) {
    if (photoEntry.size > MAX_PHOTO_BYTES) {
      return Response.json(
        {
          ok: false,
          error: "That photo is too large. Please upload an image of 5 MB or less.",
        },
        { status: 413 }
      );
    }

    if (!ALLOWED_PHOTO_TYPES.includes(photoEntry.type as never)) {
      return Response.json(
        {
          ok: false,
          error: "That photo is not a supported image. Please upload a JPG, PNG or WebP file.",
        },
        { status: 415 }
      );
    }

    const data = Buffer.from(await photoEntry.arrayBuffer());
    photo = { data, mimeType: photoEntry.type, fileName: photoEntry.name };
  }

  const result = await submitReview({
    productSlug,
    rating,
    text,
    name,
    orderId,
    photo,
  });

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  return Response.json(
    {
      ok: true,
      id: result.id,
      message:
        "Thank you — your review is waiting for approval and will appear on the page once it is approved.",
    },
    { status: 201 }
  );
}
