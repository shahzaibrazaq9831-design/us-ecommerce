/**
 * Cache tags shared by the storefront data layer and the admin actions that
 * invalidate it. Kept in its own module so a server action can import the tag
 * without importing the whole catalogue reader.
 */

/** Every cached storefront product list is tagged with this. */
export const STOREFRONT_PRODUCTS_TAG = "storefront-products";
