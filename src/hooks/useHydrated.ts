"use client";

import { useSyncExternalStore } from "react";

/** Nothing ever changes here, so there is nothing to listen to. */
const subscribe = () => () => {};

/**
 * True once this component has rendered in the browser.
 *
 * The server always says "no" and the browser always says "yes", which
 * is what keeps the two first renders identical — no hydration warning
 * — while still letting a page know when the browser's own state (the
 * cart, the cookie choice) is available.
 *
 * It is read through `useSyncExternalStore` rather than set in an
 * effect, so the browser's answer arrives with the render instead of
 * causing a second one.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
