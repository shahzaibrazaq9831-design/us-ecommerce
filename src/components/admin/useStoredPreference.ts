"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed preference store. `useSyncExternalStore` keeps the
 * server and first client render identical, then picks up the saved browser
 * value after hydration without an effect that sets state synchronously.
 */
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", notify);
  };
}

export function useStoredPreference(key: string, fallback: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => (typeof window === "undefined" ? fallback : window.localStorage.getItem(key) ?? fallback),
    () => fallback
  );

  const setValue = useCallback(
    (next: string) => {
      window.localStorage.setItem(key, next);
      notify();
    },
    [key]
  );

  return [value, setValue] as const;
}
