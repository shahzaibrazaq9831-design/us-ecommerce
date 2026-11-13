import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  readSessionToken,
} from "@/lib/admin-session-token";

/**
 * The gate in front of the admin area.
 *
 * Every request for /admin is checked here, before a route is rendered. A
 * visitor who is not signed in is sent to the sign-in page with a real
 * redirect — no admin page is rendered for them, not even the empty shell of
 * one.
 *
 * This is the quick gate. The real one is inside the app: the admin layout,
 * every admin page and every admin server action check the session again
 * for themselves, because a check here alone would not survive a change to
 * the cookie between this check and the render.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The sign-in page has to stay reachable, or nobody could sign in.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = readSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    // The gate has the clock, so this is where a session that has run out
    // is turned away — before anything is rendered.
    Date.now()
  );

  if (session) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  url.searchParams.set("next", `${pathname}${search}`);

  // A form that is posted while the session is gone has to land on the
  // sign-in page as a page load, not as another post.
  const status =
    request.method === "GET" || request.method === "HEAD" ? 307 : 303;

  return NextResponse.redirect(url, status);
}

export const config = {
  matcher: ["/admin/:path*"],
};
