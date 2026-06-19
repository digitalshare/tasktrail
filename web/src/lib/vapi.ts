import Vapi from "@vapi-ai/web";
import { appStore } from "./store";
import { handleToolCall } from "../voice/tools";

const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY as string;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID as string;

let vapi: Vapi | null = null;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

function getVapi(): Vapi {
  if (vapi) return vapi;
  vapi = new Vapi(PUBLIC_KEY);
  vapi.on("call-start", () => appStore.set({ callStatus: "active" }));
  vapi.on("call-end", () => appStore.set({ callStatus: "ended", speaking: false }));
  vapi.on("speech-start", () => appStore.set({ speaking: true }));
  vapi.on("speech-end", () => appStore.set({ speaking: false }));
  vapi.on("volume-level", (v: number) => appStore.set({ volume: v }));
  vapi.on("error", (e: any) => console.error("[vapi error]", e));
  vapi.on("message", (m: any) => onMessage(m));
  return vapi;
}

function pushTranscript(role: "user" | "assistant", text: string) {
  if (!text?.trim()) return;
  appStore.set((s) => ({ transcript: [...s.transcript, { id: uid(), role, text }] }));
}

async function onMessage(m: any) {
  if (m?.type === "transcript" && m.transcriptType === "final") {
    pushTranscript(m.role === "user" ? "user" : "assistant", m.transcript);
    return;
  }
  if (m?.type === "tool-calls") {
    const calls = m.toolCallList ?? m.toolCalls ?? (m.toolCall ? [m.toolCall] : []);
    for (const c of calls) {
      const name = c?.name ?? c?.function?.name;
      let args = c?.arguments ?? c?.function?.arguments ?? {};
      if (typeof args === "string") {
        try {
          args = JSON.parse(args);
        } catch {
          args = {};
        }
      }
      if (!name) continue;
      const result = await handleToolCall(name, args);
      narrate(`Result of ${name}: ${JSON.stringify(result)}. Brief the worker on this in 1-2 short spoken sentences and state the single most important next action.`);
    }
  }
}

/** Inject a system message so the assistant speaks about something that just happened. */
export function narrate(content: string) {
  if (!vapi || appStore.get().callStatus !== "active") return;
  try {
    vapi.send({ type: "add-message", message: { role: "system", content }, triggerResponseEnabled: true });
  } catch (e) {
    console.error("[vapi narrate]", e);
  }
}

export async function startCall() {
  if (!ASSISTANT_ID) {
    console.error("VITE_VAPI_ASSISTANT_ID is not set — run `npm run vapi:bootstrap`.");
    return;
  }
  appStore.set({ callStatus: "connecting", transcript: [] });
  try {
    await getVapi().start(ASSISTANT_ID);
  } catch (e) {
    console.error("[vapi start]", e);
    appStore.set({ callStatus: "idle" });
  }
}

export async function stopCall() {
  try {
    await getVapi().stop();
  } catch (e) {
    console.error("[vapi stop]", e);
  }
}
