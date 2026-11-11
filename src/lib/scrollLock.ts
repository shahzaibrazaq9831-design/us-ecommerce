/**
 * Whole-page scroll lock.
 *
 * The root element is the real scroller on this site — `html` carries
 * `overflow-y: scroll` — so the root is what has to be locked.
 *
 * Locking `<body>` instead looks equivalent but breaks two things:
 *
 *   - the page keeps scrolling behind the overlay, because the root still
 *     scrolls;
 *   - `overflow: hidden` turns `<body>` into a scroll container, and the
 *     sticky header then sticks to that non-scrolling box instead of the
 *     viewport, so the navbar slides away with the content.
 *
 * The lock is reference counted, so overlapping locks (the offer popup and
 * the mobile drawer, for example) can never unlock each other.
 */
let lockCount = 0;

/**
 * Scroll offset captured when the page was first locked. Some browsers
 * (iOS Safari in particular) drop the root scroll offset while the root's
 * overflow is hidden, so it is restored on unlock. Without this, closing an
 * overlay moved the page under the visitor.
 */
let lockedScrollY = 0;

/** Lock scrolling for the whole page. Safe to call from several places. */
export function lockPageScroll(): void {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    lockedScrollY = window.scrollY;
    // The scrollbar belongs to the root, so hiding it would widen the page by
    // the scrollbar width. Reserve that space with padding instead.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${scrollbar}px`;
    }
  }

  lockCount += 1;
}

/** Release one lock. The page scrolls again once the last lock is gone. */
export function unlockPageScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) return;

  lockCount -= 1;
  if (lockCount === 0) {
    document.documentElement.style.overflow = "";
    document.body.style.paddingRight = "";
    // Put the visitor back exactly where they were. `behavior: "auto"` keeps
    // this instant — a smooth restore would glide the page while the overlay
    // is still fading out.
    if (Math.abs(window.scrollY - lockedScrollY) > 1) {
      window.scrollTo({ top: lockedScrollY, behavior: "auto" });
    }
  }
}
