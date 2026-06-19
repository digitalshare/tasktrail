import type { ChecklistItem, Finding } from "./store";

// Browser talks to InsForge over its REST API with the public anon key (reads are
// public; all writes + Nebius vision go through the site-ops edge function).
const BASE_URL = import.meta.env.VITE_INSFORGE_BASE_URL as string;
const ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

const headers = { Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" };

async function records<T>(table: string, query = "select=*"): Promise<T[]> {
  const r = await fetch(`${BASE_URL}/api/database/records/${table}?${query}`, { headers });
  if (!r.ok) throw new Error(`read ${table}: ${r.status} ${await r.text()}`);
  return (await r.json()) as T[];
}

export async function fetchChecklist(): Promise<ChecklistItem[]> {
  const rows = await records<ChecklistItem>("checklist_items");
  return rows.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

export async function fetchFindings(): Promise<Finding[]> {
  return records<Finding>("findings");
}

/**
 * Invoke the `site-ops` edge function (writes + Nebius vision). The function
 * holds the admin + Nebius keys server-side; the browser only carries the anon key.
 */
export async function siteOps<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`${BASE_URL}/functions/site-ops`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, payload }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.error) throw new Error(body.error || `site-ops ${action} failed (${r.status})`);
  return body.data as T;
}
