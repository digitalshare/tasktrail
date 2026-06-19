// Seed the site-safety checklist. Idempotent: clears checklist_items and re-inserts.
//   npm run insforge:seed
import { config } from "../src/config.js";

const BASE = config.insforge.baseUrl;
const H = {
  Authorization: `Bearer ${config.insforge.apiKey}`,
  "x-api-key": config.insforge.apiKey,
  "Content-Type": "application/json",
};

const CHECKLIST = [
  {
    label: "PPE compliance",
    category: "PPE",
    sop_text: "All workers wear hard hats, hi-vis, eye protection, and proper footwear (OSHA 1926.95).",
  },
  {
    label: "Fall protection",
    category: "Fall Protection",
    sop_text: "Guardrails, harnesses, or nets in place for any work above 6 ft (OSHA 1926.501).",
  },
  {
    label: "Scaffolding integrity",
    category: "Scaffolding",
    sop_text: "Scaffolds fully planked, base plates and mudsills set, safe access provided (OSHA 1926.451).",
  },
  {
    label: "Ladder safety",
    category: "Access",
    sop_text: "Ladders extend 3 ft above the landing, secured, and on stable ground (OSHA 1926.1053).",
  },
  {
    label: "Electrical safety",
    category: "Electrical",
    sop_text: "No exposed live conductors; GFCI on temporary power; panels covered (OSHA 1926.405).",
  },
  {
    label: "Excavation protection",
    category: "Excavation",
    sop_text: "Trenches over 5 ft protected by sloping or shoring; spoil set back 2 ft (OSHA 1926.652).",
  },
  {
    label: "Housekeeping",
    category: "Housekeeping",
    sop_text: "Walkways clear of debris and trip hazards; materials stacked and secured.",
  },
];

async function api(path: string, init?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: { ...H, ...(init?.headers ?? {}) } });
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${await r.text()}`);
  return r.json().catch(() => null);
}

async function main() {
  console.log(`Seeding checklist @ ${BASE}`);
  await api("/api/database/advance/rawsql", {
    method: "POST",
    body: JSON.stringify({ query: "TRUNCATE checklist_items", params: [] }),
  });
  const rows = CHECKLIST.map((c, i) => ({ ...c, status: "pending", order_index: i + 1 }));
  await api("/api/database/records/checklist_items", { method: "POST", body: JSON.stringify(rows) });
  console.log(`Inserted ${rows.length} checklist items.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
