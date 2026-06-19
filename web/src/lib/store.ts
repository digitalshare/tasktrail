import { useSyncExternalStore } from "react";

export type Severity = "low" | "medium" | "high" | "critical";
export type CallStatus = "idle" | "connecting" | "active" | "ended";

export interface Finding {
  id?: string;
  hazard: string;
  severity: Severity;
  location?: string;
  recommendation?: string;
  sop_ref?: string;
  image_id?: string;
  image_label?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  sop_text: string;
  category: string;
  status: string;
  order_index: number;
}

export interface Report {
  id: string;
  title: string;
  summary: string;
  score: number;
  status: string;
  findings_count: number;
}

export interface TranscriptLine {
  id: string;
  role: "assistant" | "user";
  text: string;
}

export interface Escalation {
  hazard: string;
  reason?: string;
  severity: Severity;
}

export interface AppState {
  callStatus: CallStatus;
  speaking: boolean;
  volume: number;
  selectedImageId: string;
  analyzing: boolean;
  findingsByImage: Record<string, Finding[]>;
  overallRiskByImage: Record<string, Severity>;
  checklist: ChecklistItem[];
  findings: Finding[];
  escalations: Escalation[];
  transcript: TranscriptLine[];
  report: Report | null;
  score: number;
  banner: { hazard: string } | null;
}

const initial: AppState = {
  callStatus: "idle",
  speaking: false,
  volume: 0,
  selectedImageId: "scaffold",
  analyzing: false,
  findingsByImage: {},
  overallRiskByImage: {},
  checklist: [],
  findings: [],
  escalations: [],
  transcript: [],
  report: null,
  score: 100,
  banner: null,
};

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

function createStore(start: AppState) {
  let state = start;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch: Patch) => {
      const p = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...p };
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const appStore = createStore(initial);

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.get()),
    () => selector(initial),
  );
}
