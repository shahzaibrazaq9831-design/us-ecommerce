/**
 * Seed script for admin foundation.
 *
 * Imports the current product catalogue from src/lib/products.ts and
 * writes seed data suitable for the Supabase database schema in
 * db/admin-1.sql. Run manually: `npx ts-node db/seed.ts`
 *
 * All inputs are validated with zod.  Changes are logged via the
 * admin_audit_log mechanism (called from the admin server actions).
 */

import { products as catalogueProducts } from "@/lib/products";
import { z } from "zod";

// -------------------------------------------------------------------
// Zod validation schema for a product seed
// -------------------------------------------------------------------
const productSeedSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  occasions: z.array(z.string()).nonempty(),
  brand: z.string().min(1),
  price: z.number().int().positive(),
  originalPrice: z.number().int().positive().optional(),
  description: z.string().min(1),
  image: z.string().url(),
  images: z.array(z.string().url()).nonempty(),
  badge: z.enum(["new", "sale", "bestseller"]).optional(),
  isNew: z.boolean(),
  isBestSeller: z.boolean(),
  stitching: z.array(z.string()).nonempty(),
  sku: z.string().optional(),
  availability: z.enum(["in_stock", "out_of_stock"]).optional(),
});

type ProductSeed = z.infer<typeof productSeedSchema>;

const validatedSeeds: ProductSeed[] = [];

for (const seed of catalogueProducts) {
  try {
    const data = productSeedSchema.parse(seed);
    validatedSeeds.push(data);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "errors" in error) {
      console.error(`[seed] Validation error for "${seed.slug}":`, (error as { errors: unknown }).errors);
    } else {
      console.error(`[seed] Validation error for "${seed.slug}":`, error);
    }
  }
}

// -------------------------------------------------------------------
// Summary
// -------------------------------------------------------------------
console.log(
  `[seed] ${validatedSeeds.length}/${catalogueProducts.length} products ` +
    `validated and ready for import.`
);
console.log(
  `[seed] Sample slugs: ${validatedSeeds
    .slice(0, 5)
    .map((p) => p.slug)
    .join(", ")}`
);

// -------------------------------------------------------------------
// TODO: When Supabase is configured, this script would transform each
// validated seed into an INSERT statement and upsert into the database.
// For now, the script validates and outputs a summary.
// -------------------------------------------------------------------

export { validatedSeeds };