/** Zod schemas shared by the admin forms and their server actions. */

import { z } from "zod";
import { ADMIN_ORDER_STATUSES } from "./status";

const slug = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case letters, numbers and dashes.");

const assetPath = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .refine(
    (value) => value.startsWith("/") || /^https:\/\//i.test(value),
    "Use an uploaded URL or a path starting with /."
  );

export const productSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2, "Give the product a name.").max(160),
  slug,
  description: z.string().trim().min(10, "Add a short description.").max(4000),
  categorySlug: slug,
  brandSlug: slug,
  occasionSlugs: z.array(slug).max(20),
  price: z.coerce.number().int().nonnegative("Price cannot be negative."),
  salePrice: z.coerce
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
    .transform((value) => (value === 0 ? null : value)),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  stitching: z
    .array(z.enum(["unstitched", "standard", "custom"]))
    .min(1, "Choose at least one stitching option."),
  isNew: z.boolean(),
  isBestSeller: z.boolean(),
  status: z.enum(["draft", "active", "hidden"]),
  sku: z.string().trim().max(60),
  images: z.array(assetPath).min(1, "Add at least one image.").max(12),
});

export type ProductInput = z.infer<typeof productSchema>;

export const taxonomySchema = z.object({
  kind: z.enum(["category", "brand", "occasion"]),
  slug,
  name: z.string().trim().min(2, "Give it a name.").max(120),
  description: z.string().trim().max(1000),
  imageUrl: z.union([assetPath, z.literal("")]),
});

export type TaxonomyInput = z.infer<typeof taxonomySchema>;

export const reviewStatusSchema = z.object({
  id: z.string().trim().min(1).max(120),
  status: z.enum(["pending", "approved", "hidden"]),
});

export const orderStatusSchema = z.object({
  id: z.string().trim().min(1).max(40),
  status: z.enum(ADMIN_ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email("Enter a valid email address."),
  contactPhone: z.string().trim().min(5).max(40),
  shippingText: z.string().trim().min(10).max(1000),
  announcementText: z.string().trim().min(5).max(500),
  offerEnabled: z.boolean(),
  offerEndDate: z
    .string()
    .trim()
    .refine((value) => !value || Number.isFinite(Date.parse(value)), "Use a valid date."),
  discountCode: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "Use capital letters, numbers, dashes or underscores."),
  discountPercent: z.coerce.number().int().min(1).max(100),
  returnsText: z.string().trim().min(20).max(8000),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const uploadSchema = z.object({
  kind: z.enum(["product", "review"]),
});
