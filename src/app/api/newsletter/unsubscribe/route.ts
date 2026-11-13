import { unsubscribe } from "@/lib/newsletter";
import { sendUnsubscribeNotice } from "@/lib/email";
import { newsletterPage, newsletterPageResponse } from "../page-shell";

/**
 * Unsubscribe from the newsletter.
 *
 * One click, no sign-in: the link in every newsletter carries a signed
 * token that names the address to remove. The link cannot be edited to
 * remove somebody else.
 *
 * Both GET and POST are answered, because a "one-click unsubscribe"
 * button in an email client sends a POST, while a link in the body of
 * a message is a GET.
 */
async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let token = url.searchParams.get("token") ?? "";

  if (!token && request.method === "POST") {
    try {
      const form = await request.formData();
      token = String(form.get("token") ?? "");
    } catch {
      token = "";
    }
  }

  const result = await unsubscribe(token);

  if (!result.ok) {
    return newsletterPageResponse(
      newsletterPage({
        title: "That link did not work",
        message:
          "This unsubscribe link is no longer valid. Please write to us and we will remove you by hand.",
        linkLabel: "Back to the shop",
        linkHref: "/",
      })
    );
  }

  await sendUnsubscribeNotice(result.email);

  return newsletterPageResponse(
    newsletterPage({
      title: "You have unsubscribed",
      message:
        "You are off the list, and you will not hear from us again unless you sign up again yourself.",
      linkLabel: "Back to the shop",
      linkHref: "/",
    })
  );
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
