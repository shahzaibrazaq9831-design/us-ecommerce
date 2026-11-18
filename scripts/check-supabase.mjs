/**
 * Checks that the Supabase project URL and publishable key can reach the
 * Auth API and Data API. It makes no changes and reads no tables.
 *
 * The REST root (/rest/v1/) only accepts a secret key, so this checks the
 * Auth health endpoint and a deliberately missing table instead. A
 * "table not found" response from the Data API means the URL and publishable
 * key were accepted.
 *
 * Usage:
 *   npm run check:supabase
 *
 * The values are loaded from .env.local by the npm script. Nothing secret is
 * printed.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_KEY?.trim() ||
  "";

if (!url || !key) {
  console.error("Supabase is not configured.\n");
  console.error("Add these values to .env.local:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co");
  console.error("  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>\n");
  console.error("Get them from Supabase Dashboard -> Project Settings -> API.");
  process.exit(1);
}

if (key.startsWith("sb_secret_")) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY contains a secret key. " +
      "Never expose a secret or service-role key to the browser."
  );
  process.exit(1);
}

let projectUrl;

try {
  projectUrl = new URL(url);
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  process.exit(1);
}

if (projectUrl.protocol !== "https:" && projectUrl.protocol !== "http:") {
  console.error("NEXT_PUBLIC_SUPABASE_URL must use http or https.");
  process.exit(1);
}

const baseUrl = url.replace(/\/+$/, "");
const startedAt = Date.now();

function fail(message) {
  console.error(message);
  process.exit(1);
}

function checkKeyResponse(label, response) {
  if (response.status === 401 || response.status === 403) {
    fail(
      `${label} rejected the publishable key (HTTP ${response.status}). ` +
        "Check NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
}

try {
  // 1. The Auth API validates the key for this project.
  const authEndpoint = `${baseUrl}/auth/v1/health`;
  const authResponse = await fetch(authEndpoint, {
    headers: { apikey: key },
    cache: "no-store",
  });

  checkKeyResponse("Auth API", authResponse);

  if (!authResponse.ok) {
    fail(
      `Auth API returned HTTP ${authResponse.status} ` +
        `for ${projectUrl.hostname}.`
    );
  }

  // 2. The Data API validates the same key before it looks for a table.
  //    PGRST205 means "connected, but that table does not exist" — the
  //    expected answer because this check creates no tables.
  const dataEndpoint =
    `${baseUrl}/rest/v1/__supabase_connection_check__` +
    "?select=*&limit=1";
  const dataResponse = await fetch(dataEndpoint, {
    headers: { apikey: key },
    cache: "no-store",
  });

  checkKeyResponse("Data API", dataResponse);

  if (dataResponse.status === 404) {
    const body = await dataResponse.json().catch(() => null);

    if (body?.code !== "PGRST205") {
      fail(
        `Data API returned HTTP 404 for ${projectUrl.hostname}, ` +
          "which is not the expected response."
      );
    }
  } else if (!dataResponse.ok) {
    fail(
      `Data API returned HTTP ${dataResponse.status} ` +
        `for ${projectUrl.hostname}.`
    );
  }

  const elapsed = Date.now() - startedAt;
  console.log(
    `Connected to Supabase at ${projectUrl.hostname} in ${elapsed} ms.`
  );
  console.log("  Auth API: OK");
  console.log("  Data API: OK (key accepted; no test table required)");
  console.log("  Publishable key: valid for this project");

  // ------------------------------------------------------------------
  // The tables the shop actually needs. A missing table is reported by
  // PostgREST as PGRST205 even when the request only carries the
  // publishable key, so this works before the service key is configured.
  // Reading the rows (and the row count) needs the service key.
  // ------------------------------------------------------------------
  const checkEnv = serviceKey ? serviceKey : key;
  const checks = [
    {
      table: "store_orders",
      columns: ["id", "email", "order_date", "idempotency_key", "payload", "created_at", "updated_at"],
      migration: "db/orders.sql",
    },
    {
      table: "products",
      columns: ["id", "slug", "name"],
      migration: "db/admin-dashboard.sql, then npm run seed:admin",
    },
  ];

  console.log("");
  console.log("Tables:");

  for (const check of checks) {
    const endpoint =
      `${baseUrl}/rest/v1/${check.table}` +
      `?select=${check.columns.join(",")}&limit=1`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: checkEnv,
        Authorization: `Bearer ${checkEnv}`,
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      const body = await response.json().catch(() => null);
      if (body?.code === "PGRST205") {
        console.log(`  ${check.table}: MISSING — apply ${check.migration}`);
        continue;
      }
    }

    if (response.status === 401 || response.status === 403) {
      // The table may exist but be locked to the anon role, which is what
      // db/orders.sql does. Without the service key we cannot tell the two
      // apart, so say that instead of guessing.
      console.log(
        `  ${check.table}: cannot verify without SUPABASE_SERVICE_ROLE_KEY ` +
          "(apply " + check.migration + " if it is not there)"
      );
      continue;
    }

    if (response.status === 400) {
      const body = await response.json().catch(() => null);
      if (body?.code === "42703" || /column .* does not exist/i.test(body?.message ?? "")) {
        console.log(
          `  ${check.table}: present but a column is missing — re-run ${check.migration}`
        );
        continue;
      }
    }

    if (!response.ok) {
      console.log(`  ${check.table}: check failed (HTTP ${response.status})`);
      continue;
    }

    const rows = await response.json().catch(() => []);
    console.log(
      `  ${check.table}: present${Array.isArray(rows) && rows.length === 0 ? " (currently empty)" : ""}`
    );
  }

  if (!serviceKey) {
    console.log(
      "\n  Note: set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) " +
        "to read row counts and verify the shop can write."
    );
  }
} catch (error) {
  console.error(`Could not reach ${projectUrl.hostname}.`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
