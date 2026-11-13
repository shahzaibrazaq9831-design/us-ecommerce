import { confirmSubscription } from "@/lib/newsletter";
import { newsletterPage, newsletterPageResponse } from "../page-shell";

/**
 * Confirm a newsletter subscription.
 *
 * The link in the confirmation email carries a signed token, so this
 * page can only confirm the address that was signed up — the link
 * cannot be edited to confirm somebody else's.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const result = await confirmSubscription(token);

  if (!result.ok) {
    return newsletterPageResponse(
      newsletterPage({
        title: "That link did not work",
        message:
          "This confirmation link is no longer valid. Please sign up again and we will send you a fresh one.",
        linkLabel: "Back to the shop",
        linkHref: "/",
      })
    );
  }

  return newsletterPageResponse(
    newsletterPage({
      title: "You are on the list",
      message:
        "Thank you — your subscription is confirmed. You will hear from us when there is something worth writing about.",
      linkLabel: "Back to the shop",
      linkHref: "/",
    })
  );
}
