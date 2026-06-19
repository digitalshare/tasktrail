// Action handlers shared by BOTH the voice assistant (Vapi tool-calls) and the
// on-screen buttons. Each action calls InsForge / Nebius and updates the store.
import { appStore, type Finding, type Severity } from "../lib/store";
import { fetchChecklist, siteOps } from "../lib/insforge";
import { getImage, imageToDataUrl } from "../data/demo";

const SERIOUS: Severity[] = ["high", "critical"];
const norm = (s?: string) => (s ?? "").toLowerCase();

export async function loadInitialData() {
  try {
    const checklist = await fetchChecklist();
    appStore.set({ checklist });
  } catch (e) {
    console.error("loadInitialData", e);
  }
}

export function selectImage(id: string) {
  appStore.set({ selectedImageId: id });
}

/** Run Nebius vision on the currently-selected camera view. */
export async function analyzeView(focus?: string) {
  const { selectedImageId } = appStore.get();
  const img = getImage(selectedImageId);
  appStore.set({ analyzing: true });
  try {
    const dataUrl = await imageToDataUrl(img.src);
    const data = await siteOps<{ overallRisk: Severity; summary: string; hazards: Finding[] }>("analyzeImage", {
      imageBase64: dataUrl,
      imageId: img.id,
      imageLabel: img.label,
      focus,
    });
    const hazards = data.hazards ?? [];
    appStore.set((s) => ({
      analyzing: false,
      findingsByImage: { ...s.findingsByImage, [img.id]: hazards },
      overallRiskByImage: { ...s.overallRiskByImage, [img.id]: data.overallRisk },
      findings: [...s.findings, ...hazards],
    }));
    const serious = hazards.find((h) => SERIOUS.includes(norm(h.severity) as Severity));
    if (serious) appStore.set({ banner: { hazard: serious.hazard } });
    return {
      area: img.label,
      overallRisk: data.overallRisk,
      summary: data.summary,
      hazards: hazards.map((h) => ({ hazard: h.hazard, severity: h.severity, recommendation: h.recommendation })),
    };
  } catch (e) {
    appStore.set({ analyzing: false });
    return { error: String((e as Error).message ?? e), area: img.label };
  }
}

function matchItem(text: string) {
  const { checklist } = appStore.get();
  const t = norm(text);
  return (
    checklist.find((c) => norm(c.label) === t) ??
    checklist.find((c) => t.includes(norm(c.label)) || norm(c.label).includes(t)) ??
    checklist.find((c) => norm(c.category) && t.includes(norm(c.category)))
  );
}

export async function completeItem(itemText: string) {
  const item = matchItem(itemText);
  if (!item) return { error: `No checklist item matching "${itemText}"` };
  try {
    await siteOps("completeChecklistItem", { id: item.id });
    appStore.set((s) => ({
      checklist: s.checklist.map((c) => (c.id === item.id ? { ...c, status: "done" } : c)),
    }));
    return { item: item.label, status: "verified" };
  } catch (e) {
    return { error: String((e as Error).message ?? e) };
  }
}

export async function escalate(hazard: string, reason?: string, severity: Severity = "high") {
  try {
    await siteOps("escalate", { hazard, reason, severity });
    appStore.set((s) => ({
      escalations: [...s.escalations, { hazard, reason, severity }],
      banner: { hazard },
    }));
    return { escalated: hazard, severity };
  } catch (e) {
    return { error: String((e as Error).message ?? e) };
  }
}

export async function generateReport() {
  try {
    const data = await siteOps<{ report: any; score: number }>("createReport", {});
    appStore.set({ report: data.report, score: data.score });
    return { score: data.score, summary: data.report?.summary };
  } catch (e) {
    return { error: String((e as Error).message ?? e) };
  }
}

export async function resetDemo() {
  try {
    await siteOps("resetDemo", {});
  } catch (e) {
    console.error("resetDemo", e);
  }
  appStore.set({
    findingsByImage: {},
    overallRiskByImage: {},
    findings: [],
    escalations: [],
    report: null,
    score: 100,
    banner: null,
    transcript: [],
  });
  await loadInitialData();
}

export function dismissBanner() {
  appStore.set({ banner: null });
}

/** Dispatch a Vapi tool-call to the matching action. Returns a result to narrate. */
export async function handleToolCall(name: string, args: Record<string, any>) {
  switch (name) {
    case "analyzeCurrentView":
      return analyzeView(args.focus);
    case "markChecklistItemComplete":
      return completeItem(args.item ?? "");
    case "escalateHazard":
      return escalate(args.hazard ?? "Unspecified hazard", args.reason, (args.severity as Severity) ?? "high");
    case "generateReport":
      return generateReport();
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
