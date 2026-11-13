import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ordersPath = path.join(process.cwd(), ".data", "orders.json");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before migrating orders."
  );
}

const rawOrders = await fs.readFile(ordersPath, "utf8");
const parsedOrders = JSON.parse(rawOrders);
if (!Array.isArray(parsedOrders)) {
  throw new Error("The local orders file must contain a JSON array.");
}

const orders = parsedOrders.map((order) => {
  if (
    !order ||
    typeof order !== "object" ||
    typeof order.id !== "string" ||
    typeof order.date !== "string" ||
    typeof order.email !== "string"
  ) {
    throw new Error("The local orders file contains an invalid order.");
  }

  const legacyStatuses = {
    pending: "new",
    confirmed: "paid",
    in_production: "stitching",
  };
  return {
    ...order,
    status: legacyStatuses[order.status] ?? order.status,
  };
});

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry) ?? "null").join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(
        ([key, entry]) =>
          `${JSON.stringify(key)}:${stableStringify(entry) ?? "null"}`
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
let inserted = 0;
let alreadyPresent = 0;

for (const order of orders) {
  const row = {
    id: order.id,
    email: order.email || order.customer?.email || "",
    order_date: order.date,
    idempotency_key: order.idempotencyKey ?? null,
    payload: order,
  };

  const { data: existingById, error: lookupError } = await supabase
    .from("store_orders")
    .select("payload")
    .eq("id", order.id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Could not check for existing order ${order.id}: ${lookupError.message}`);
  }

  if (existingById) {
    if (stableStringify(existingById.payload) !== stableStringify(order)) {
      throw new Error(
        `Order ${order.id} already exists in Supabase with different data; migration stopped without overwriting it.`
      );
    }
    alreadyPresent += 1;
    continue;
  }

  const { error: insertError } = await supabase.from("store_orders").insert(row);
  if (insertError) {
    throw new Error(`Could not migrate order ${order.id}: ${insertError.message}`);
  }
  inserted += 1;
}

process.stdout.write(
  `Order migration complete. Inserted: ${inserted}; already present: ${alreadyPresent}.\n`
);
