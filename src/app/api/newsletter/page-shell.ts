/**
 * The small page the newsletter links land on.
 *
 * These are plain HTML pages rather than a route of the site: the link
 * in an email has to work on its own, without the site around it, and
 * without asking anyone to sign in.
 */
export function newsletterPage({
  title,
  message,
  linkLabel,
  linkHref,
}: {
  title: string;
  message: string;
  linkLabel: string;
  linkHref: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:32px 20px;background:#f7f4ef;font-family:Georgia,'Times New Roman',serif;color:#2b2118;display:flex;justify-content:center;">
    <div style="max-width:520px;width:100%;background:#ffffff;border:1px solid #e6ded2;border-radius:12px;padding:32px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#b08b57;">Rung E Bahar</p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;">${title}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${message}</p>
      <a href="${linkHref}" style="display:inline-block;background:#2b2118;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;">${linkLabel}</a>
    </div>
  </body>
</html>`;
}

/** The response that carries one of those pages. */
export function newsletterPageResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
