// InsForge edge function (Deno) — "site-ops"
//
// The server-side workflow engine for the AI Construction Site Safety Supervisor.
// The browser/Vapi tools call this with { action, payload }. It holds the Nebius
// key and the InsForge admin key as secrets (never exposed to the browser):
//   - analyzeImage      : run Nebius Qwen2.5-VL hazard analysis + persist findings
//   - completeChecklistItem
//   - logFinding
//   - escalate
//   - createReport      : aggregate findings + checklist into a safety report
//   - resetDemo         : clear findings/reports/escalations, reset checklist
//
// Deployed inline via POST /api/functions by insforge/provision.ts.

const NEBIUS_API_KEY = Deno.env.get("NEBIUS_API_KEY") ?? "";
const SERVICE_API_KEY = Deno.env.get("SERVICE_API_KEY") ?? "";
const BASE_URL = (Deno.env.get("INSFORGE_BASE_URL") ?? "").replace(/\/$/, "");
const VISION_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// --- InsForge data API (admin) ------------------------------------------------
const adminHeaders = {
  Authorization: `Bearer ${SERVICE_API_KEY}`,
  "x-api-key": SERVICE_API_KEY,
  "Content-Type": "application/json",
};

async function dbInsert(table: string, rows: Record<string, unknown>[]) {
  const r = await fetch(`${BASE_URL}/api/database/records/${table}`, {
    method: "POST",
    headers: { ...adminHeaders, Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`insert ${table} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function dbSelect(table: string, query = "select=*") {
  const r = await fetch(`${BASE_URL}/api/database/records/${table}?${query}`, {
    headers: adminHeaders,
  });
  if (!r.ok) throw new Error(`select ${table} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function dbPatch(table: string, query: string, patch: Record<string, unknown>) {
  const r = await fetch(`${BASE_URL}/api/database/records/${table}?${query}`, {
    method: "PATCH",
    headers: { ...adminHeaders, Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error(`patch ${table} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function rawSql(query: string) {
  const r = await fetch(`${BASE_URL}/api/database/advance/rawsql`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ query, params: [] }),
  });
  if (!r.ok) throw new Error(`rawsql failed: ${r.status} ${await r.text()}`);
  return r.json();
}

// --- Nebius vision ------------------------------------------------------------
const SEVERITY_WEIGHT: Record<string, number> = { low: 5, medium: 12, high: 25, critical: 40 };

const VISION_PROMPT = `You are an OSHA-trained construction-site safety inspector reviewing a photo from the field.
Inspect for: missing/incorrect PPE (hard hats, harnesses, hi-vis, gloves, eye protection), fall and edge risks, scaffolding/ladder issues, electrical and fire hazards, trip/housekeeping hazards, and unsafe equipment use.
Return STRICT JSON only, no prose, in this shape:
{
  "overallRisk": "low" | "medium" | "high" | "critical",
  "summary": "<one concise sentence>",
  "hazards": [
    {
      "hazard": "<short title>",
      "severity": "low" | "medium" | "high" | "critical",
      "location": "<where in the image, e.g. 'worker top-left'>",
      "recommendation": "<specific corrective action>",
      "sopRef": "<relevant OSHA/SOP reference or empty string>"
    }
  ]
}
List at most the 4 most important hazards. If the scene is safe, return an empty hazards array and overallRisk "low".`;

function parseJsonLoose(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("model did not return JSON");
  }
}

async function nebiusVision(imageDataUrl: string, focus?: string) {
  const userText = focus ? `${VISION_PROMPT}\n\nFocus area requested: ${focus}` : VISION_PROMPT;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch("https://api.tokenfactory.nebius.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${NEBIUS_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL,
        response_format: { type: "json_object" },
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (r.ok) {
      const data = await r.json();
      return parseJsonLoose(data.choices?.[0]?.message?.content ?? "{}");
    }
    lastErr = `${r.status} ${await r.text()}`;
    await new Promise((res) => setTimeout(res, 2000));
  }
  throw new Error(`Nebius vision failed: ${lastErr}`);
}

// --- Actions ------------------------------------------------------------------
async function analyzeImage(p: any) {
  if (!p?.imageBase64) throw new Error("imageBase64 (data URL) is required");
  const result = await nebiusVision(p.imageBase64, p.focus);
  const hazards = Array.isArray(result.hazards) ? result.hazards : [];
  const rows = hazards.map((h: any) => ({
    image_id: p.imageId ?? null,
    image_label: p.imageLabel ?? null,
    hazard: String(h.hazard ?? "Unknown hazard"),
    severity: String(h.severity ?? "medium").toLowerCase(),
    location: h.location ?? null,
    recommendation: h.recommendation ?? null,
    sop_ref: h.sopRef ?? null,
  }));
  const saved = rows.length ? await dbInsert("findings", rows) : [];
  return {
    overallRisk: result.overallRisk ?? "low",
    summary: result.summary ?? "",
    hazards: saved.map((row: any, i: number) => ({ ...rows[i], id: row.id })),
  };
}

async function completeChecklistItem(p: any) {
  if (!p?.id) throw new Error("id is required");
  const updated = await dbPatch("checklist_items", `id=eq.${p.id}`, {
    status: p.status ?? "done",
  });
  return { item: updated[0] ?? null };
}

async function logFinding(p: any) {
  const saved = await dbInsert("findings", [
    {
      image_id: p.imageId ?? null,
      image_label: p.imageLabel ?? null,
      hazard: String(p.hazard ?? "Manual finding"),
      severity: String(p.severity ?? "medium").toLowerCase(),
      location: p.location ?? null,
      recommendation: p.recommendation ?? null,
      sop_ref: p.sopRef ?? null,
    },
  ]);
  return { finding: saved[0] };
}

async function escalate(p: any) {
  const saved = await dbInsert("escalations", [
    {
      finding_id: p.findingId ?? null,
      hazard: String(p.hazard ?? "Escalated hazard"),
      reason: p.reason ?? null,
      severity: String(p.severity ?? "high").toLowerCase(),
      status: "open",
    },
  ]);
  return { escalation: saved[0] };
}

async function createReport(_p: any) {
  const findings: any[] = await dbSelect("findings", "select=*");
  const checklist: any[] = await dbSelect("checklist_items", "select=*");
  const escalations: any[] = await dbSelect("escalations", "select=*&status=eq.open");

  const penalty = findings.reduce(
    (sum, f) => sum + (SEVERITY_WEIGHT[String(f.severity).toLowerCase()] ?? 10),
    0,
  );
  const score = Math.max(0, 100 - penalty);
  const done = checklist.filter((c) => c.status === "done").length;
  const critical = findings.filter((f) =>
    ["high", "critical"].includes(String(f.severity).toLowerCase()),
  ).length;

  const summary =
    `Inspection complete: ${findings.length} hazard(s) found (${critical} high/critical), ` +
    `${done}/${checklist.length} checklist items verified, ${escalations.length} open escalation(s). ` +
    `Safety score ${score}/100.`;

  const saved = await dbInsert("reports", [
    {
      title: `Site Safety Inspection ${new Date().toISOString().slice(0, 10)}`,
      summary,
      score,
      status: critical > 0 ? "action-required" : "passed",
      findings_count: findings.length,
    },
  ]);
  return { report: saved[0], score, findings, escalations, checklist };
}

async function resetDemo(_p: any) {
  await rawSql(
    "TRUNCATE findings, reports, escalations; UPDATE checklist_items SET status='pending';",
  );
  return { ok: true };
}

const ACTIONS: Record<string, (p: any) => Promise<unknown>> = {
  analyzeImage,
  completeChecklistItem,
  logFinding,
  escalate,
  createReport,
  resetDemo,
};

export default async function (request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const { action, payload } = await request.json();
    const handler = ACTIONS[action];
    if (!handler) return json({ error: `Unknown action: ${action}` }, 400);
    const data = await handler(payload ?? {});
    return json({ data });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
}
