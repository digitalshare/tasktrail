import type { Severity } from "./store";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const SEV = {
  low: { label: "Low", text: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-400/40", dot: "bg-emerald-400", ring: "#34d399" },
  medium: { label: "Medium", text: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-400/40", dot: "bg-amber-400", ring: "#fbbf24" },
  high: { label: "High", text: "text-orange-300", bg: "bg-orange-500/15", border: "border-orange-400/40", dot: "bg-orange-400", ring: "#fb923c" },
  critical: { label: "Critical", text: "text-red-300", bg: "bg-red-500/20", border: "border-red-400/50", dot: "bg-red-400", ring: "#f87171" },
} as const;

export function sev(s?: string) {
  const k = (s ?? "low").toLowerCase() as Severity;
  return SEV[k] ?? SEV.low;
}

export function scoreColor(score: number): string {
  if (score >= 85) return "#34d399";
  if (score >= 60) return "#fbbf24";
  if (score >= 35) return "#fb923c";
  return "#f87171";
}
