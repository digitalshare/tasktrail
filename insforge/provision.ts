// Idempotent InsForge provisioning for tasktrail.
//   npm run insforge:provision
// Creates tables, the reports storage bucket, server-side secrets, and deploys
// the `site-ops` edge function. Safe to run repeatedly.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "../src/config.js";

const BASE = config.insforge.baseUrl;
const H = {
  Authorization: `Bearer ${config.insforge.apiKey}`,
  "x-api-key": config.insforge.apiKey,
  "Content-Type": "application/json",
};

async function api(path: string, init?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: { ...H, ...(init?.headers ?? {}) } });
  const text = await r.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: r.ok, status: r.status, body };
}

type Col = {
  columnName: string;
  type: "string" | "datetime" | "integer" | "float" | "boolean" | "uuid" | "json";
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
};
const col = (
  columnName: string,
  type: Col["type"],
  isNullable = true,
  defaultValue?: string,
): Col => ({ columnName, type, isNullable, isUnique: false, ...(defaultValue ? { defaultValue } : {}) });

const TABLES: { tableName: string; columns: Col[] }[] = [
  {
    tableName: "checklist_items",
    columns: [
      col("label", "string", false),
      col("sop_text", "string"),
      col("category", "string"),
      col("status", "string", false, "pending"),
      col("order_index", "integer"),
    ],
  },
  {
    tableName: "findings",
    columns: [
      col("image_id", "string"),
      col("image_label", "string"),
      col("hazard", "string", false),
      col("severity", "string", false, "medium"),
      col("location", "string"),
      col("recommendation", "string"),
      col("sop_ref", "string"),
    ],
  },
  {
    tableName: "reports",
    columns: [
      col("title", "string", false),
      col("summary", "string"),
      col("score", "integer"),
      col("status", "string", false, "draft"),
      col("findings_count", "integer"),
      col("artifact_url", "string"),
    ],
  },
  {
    tableName: "escalations",
    columns: [
      col("finding_id", "string"),
      col("hazard", "string", false),
      col("reason", "string"),
      col("severity", "string", false, "high"),
      col("status", "string", false, "open"),
    ],
  },
];

async function provisionTables() {
  const existing = await api("/api/database/tables");
  const names: string[] = Array.isArray(existing.body)
    ? existing.body.map((t: any) => (typeof t === "string" ? t : t.tableName ?? t.name))
    : existing.body?.tables?.map((t: any) => t.tableName ?? t.name ?? t) ?? [];

  for (const def of TABLES) {
    if (names.includes(def.tableName)) {
      console.log(`  table ${def.tableName} ✓ (exists)`);
      continue;
    }
    const res = await api("/api/database/tables", {
      method: "POST",
      body: JSON.stringify({ ...def, rlsEnabled: false }),
    });
    console.log(`  table ${def.tableName} ${res.ok ? "created" : "FAILED " + JSON.stringify(res.body)}`);
  }
}

async function provisionBucket() {
  const res = await api("/api/storage/buckets", {
    method: "POST",
    body: JSON.stringify({ bucketName: "reports", isPublic: true }),
  });
  // 201 created, or already-exists error — both fine.
  console.log(`  bucket reports ${res.ok ? "created" : "✓ (exists or: " + JSON.stringify(res.body).slice(0, 80) + ")"}`);
}

async function provisionSecrets() {
  const existing = await api("/api/secrets");
  const have = new Set((existing.body?.secrets ?? []).map((s: any) => s.key));
  const wanted: Record<string, string> = {
    NEBIUS_API_KEY: config.nebiusApiKey,
    SERVICE_API_KEY: config.insforge.apiKey,
  };
  for (const [key, value] of Object.entries(wanted)) {
    if (have.has(key)) {
      // keep it fresh in case the key rotated
      const upd = await api(`/api/secrets/${key}`, { method: "PUT", body: JSON.stringify({ value }) });
      console.log(`  secret ${key} ${upd.ok ? "updated" : "✓ (exists)"}`);
      continue;
    }
    const res = await api("/api/secrets", { method: "POST", body: JSON.stringify({ key, value }) });
    console.log(`  secret ${key} ${res.ok ? "created" : "FAILED " + JSON.stringify(res.body)}`);
  }
}

async function deployFunction() {
  const here = dirname(fileURLToPath(import.meta.url));
  const code = readFileSync(join(here, "functions", "site-ops.ts"), "utf8");
  const slug = "site-ops";
  const existing = await api(`/api/functions/${slug}`);
  if (existing.ok) {
    const res = await api(`/api/functions/${slug}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Site Ops", code, status: "active" }),
    });
    console.log(`  function ${slug} ${res.ok ? "updated" : "FAILED " + JSON.stringify(res.body)}`);
  } else {
    const res = await api("/api/functions", {
      method: "POST",
      body: JSON.stringify({ name: "Site Ops", slug, code, status: "active" }),
    });
    console.log(`  function ${slug} ${res.ok ? "created" : "FAILED " + JSON.stringify(res.body)}`);
  }
}

async function main() {
  console.log(`Provisioning InsForge @ ${BASE}`);
  console.log("Tables:");
  await provisionTables();
  console.log("Storage:");
  await provisionBucket();
  console.log("Secrets:");
  await provisionSecrets();
  console.log("Functions:");
  await deployFunction();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
