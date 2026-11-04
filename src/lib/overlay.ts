/**
 * True when a modal or dialog that is actually visible already owns the page.
 *
 * Some dialogs (the mobile menu drawer, for example) stay mounted while
 * hidden, so checking only for `role="dialog"` would treat them as open.
 */
export function hasOpenModal(): boolean {
  if (typeof document === "undefined") return false;
  if (document.querySelector(".modal.active")) return true;
  if (document.querySelector(".search-bar.active")) return true;
  if (document.querySelector('.currency-panel[data-open="true"]')) return true;

  return Array.from(
    document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
  ).some((element) => {
    const styles = window.getComputedStyle(element);
    return (
      styles.display !== "none" &&
      styles.visibility !== "hidden" &&
      element.getClientRects().length > 0
    );
  });
}
