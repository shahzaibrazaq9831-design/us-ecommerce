/**
 * Bulk price updater for the storefront catalogue.
 *
 * Reads a CSV with the columns `slug,price,compare_at_price` and writes them
 * to Supabase. Prices are whole PKR rupees: `price` is what the customer pays,
 * `compare_at_price` is the higher struck-through price (leave it blank when
 * the piece is not reduced).
 *
 * Usage (the npm script loads .env.local):
 *
 *   npm run update:prices -- prices.csv            # dry run, prints old → new
 *   npm run update:prices -- prices.csv --apply    # writes the rows
 *
 * The script is deliberately dry-run first. Unknown slugs are skipped and
 * reported; it never invents a product and never reads an external site.
 */

import { promises as fs } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { priceFromDb, priceToDb } from "../src/lib/db-price";

interface CsvRow {
  slug: string;
  price: number;
  compareAt: number | null;
  line: number;
}

interface FetchRow {
  id: number | string;
  slug: string;
  price_cents: number | string | null;
  sale_price_cents: number | string | null;
}

interface PlannedRow extends CsvRow {
  id: number;
  oldPrice: number;
  oldCompareAt: number | null;
  next: ReturnType<typeof priceToDb>;
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const csvPath = args.find((arg) => !arg.startsWith("--"));

if (!csvPath) {
  console.error("Usage: npm run update:prices -- prices.csv [--apply]");
  process.exit(1);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }

  if (row.length > 0 || field.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ""));
}

function wholeRupees(value: string, column: string, line: number): number {
  const amount = Number(value.replace(/[\s,\u00A0]/g, ""));
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`Line ${line}: ${column} must be a whole, non-negative number.`);
  }
  return amount;
}

function readCsv(text: string): CsvRow[] {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length < 2) throw new Error("The CSV has no price rows.");

  const header = table[0].map((cell) => cell.trim().toLowerCase());
  const slugIndex = header.indexOf("slug");
  const priceIndex = header.indexOf("price");
  const compareIndex = header.indexOf("compare_at_price");

  if (slugIndex < 0 || priceIndex < 0 || compareIndex < 0) {
    throw new Error(
      "The CSV must have the columns: slug,price,compare_at_price"
    );
  }

  return table.slice(1).map((cells, offset) => {
    const line = offset + 2;
    const slug = (cells[slugIndex] ?? "").trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`Line ${line}: invalid slug "${slug}".`);
    }

    const price = wholeRupees(cells[priceIndex] ?? "", "price", line);
    const rawCompare = (cells[compareIndex] ?? "").trim();
    const compareAt = rawCompare
      ? wholeRupees(rawCompare, "compare_at_price", line)
      : null;

    return { slug, price, compareAt, line };
  });
}

function money(value: number | null): string {
  if (value === null) return "—";
  return `Rs ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local."
    );
  }

  const rows = readCsv(await fs.readFile(csvPath as string, "utf8"));
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client
    .from("products")
    .select("id,slug,price_cents,sale_price_cents");

  if (error) throw new Error(`Could not read products: ${error.message}`);

  const bySlug = new Map<string, FetchRow>(
    ((data ?? []) as FetchRow[]).map((row) => [row.slug, row])
  );

  const planned: PlannedRow[] = [];
  const unknown: string[] = [];

  for (const row of rows) {
    const stored = bySlug.get(row.slug);
    if (!stored) {
      unknown.push(row.slug);
      continue;
    }

    const oldPrice = priceFromDb(stored);
    planned.push({
      ...row,
      id: Number(stored.id),
      oldPrice: oldPrice.price,
      oldCompareAt: oldPrice.compareAt,
      next: priceToDb(row.price, row.compareAt),
    });
  }

  console.log(`CSV rows: ${rows.length} | matched: ${planned.length} | unknown: ${unknown.length}`);
  console.log("");
  console.log("slug | old price → new price | old compare-at → new compare-at");
  console.log("--- | --- | ---");

  for (const row of planned) {
    const newPrice = row.next.sale_price_cents ?? row.next.price_cents;
    const newCompareAt =
      row.next.sale_price_cents === null ? null : row.next.price_cents;

    console.log(
      `${row.slug} | ${money(row.oldPrice)} → ${money(newPrice)} | ${money(
        row.oldCompareAt
      )} → ${money(newCompareAt)}`
    );
  }

  if (unknown.length) {
    console.log("");
    console.log("Unknown slugs (skipped):");
    for (const slug of unknown) console.log(`  - ${slug}`);
  }

  if (!apply) {
    console.log("");
    console.log("Dry run only — nothing was written. Re-run with --apply to save.");
    return;
  }

  let failures = 0;
  for (const row of planned) {
    const { error: updateError } = await client
      .from("products")
      .update(row.next)
      .eq("id", row.id);

    if (updateError) {
      failures += 1;
      console.error(`  ! ${row.slug}: ${updateError.message}`);
    }
  }

  console.log("");
  console.log(
    failures === 0
      ? `Updated ${planned.length} product${planned.length === 1 ? "" : "s"}.`
      : `Updated ${planned.length - failures} product(s); ${failures} failed.`
  );
  console.log(
    "The storefront cache also refreshes on the next request, or immediately after an admin save."
  );

  if (failures > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
