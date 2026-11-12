import { readReviewPhoto } from "@/lib/reviews";

/**
 * Serve a customer photo attached to an approved review.
 *
 * The file name is never taken from the URL — the id is looked up in the
 * review records, so only photos that belong to a real review can be
 * read.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photo = await readReviewPhoto(id);

  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "content-type": photo.mimeType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
