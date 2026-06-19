// Create/update the "SiteGuard" Vapi voice assistant. Idempotent (matches by name).
//   npm run vapi:bootstrap
// Writes the assistant id back into .env (VAPI_ASSISTANT_ID + VITE_VAPI_ASSISTANT_ID).
//
// The conversational brain runs on Nebius (custom-llm, OpenAI-compatible) by default,
// honoring the "Nebius hosting Models" stack. Set VAPI_LLM=openai to fall back to
// Vapi's built-in OpenAI provider if needed for a demo.
import { readFileSync, writeFileSync } from "node:fs";
import { VapiClient } from "@vapi-ai/server-sdk";
import { config } from "../src/config.js";

const ASSISTANT_NAME = "SiteGuard — Safety Supervisor";
const useNebius = (process.env.VAPI_LLM ?? "nebius").toLowerCase() !== "openai";

const SYSTEM_PROMPT = `You are SiteGuard, an AI construction-site safety supervisor working alongside a field worker who is wearing a headset and pointing their phone camera at the site.

Your job: keep the worker safe and the inspection moving. You follow OSHA safety SOPs, walk the worker through the site safety checklist, inspect what they show you, log hazards, escalate serious risks, and produce an inspection report at the end.

Personality: calm, direct, encouraging, safety-first. You are talking out loud, so keep replies SHORT (1-3 sentences), natural, and free of markdown or lists.

You have tools. USE THEM proactively:
- analyzeCurrentView: when the worker asks you to look at, check, inspect, or scan an area, or mentions what they're seeing. Pass a short "focus" describing what to inspect.
- markChecklistItemComplete: when an area has been verified safe or a checklist step is done.
- escalateHazard: immediately when you identify a high or critical hazard (e.g. missing fall protection, exposed live wiring).
- generateReport: when the worker says they're done or asks for the report/summary.

After a tool runs, the system will give you the result; brief the worker on it plainly and tell them the single most important next action. When you find a critical hazard, say so clearly and escalate it. Start each inspection by offering to run the checklist or look at an area.`;

const TOOLS = [
  {
    type: "function" as const,
    async: true,
    function: {
      name: "analyzeCurrentView",
      description:
        "Analyze the area the worker is currently showing on their device camera for safety hazards and PPE compliance. Call this whenever the worker asks you to check, inspect, scan, or look at something.",
      parameters: {
        type: "object" as const,
        properties: {
          focus: {
            type: "string",
            description: "Short description of what to inspect, e.g. 'fall protection on the scaffold'.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    async: true,
    function: {
      name: "markChecklistItemComplete",
      description: "Mark a site-safety checklist item as verified/complete.",
      parameters: {
        type: "object" as const,
        properties: {
          item: { type: "string", description: "Short description of the checklist item that was verified." },
        },
        required: ["item"],
      },
    },
  },
  {
    type: "function" as const,
    async: true,
    function: {
      name: "escalateHazard",
      description: "Escalate a high or critical safety hazard to the site supervisor.",
      parameters: {
        type: "object" as const,
        properties: {
          hazard: { type: "string", description: "The hazard being escalated." },
          reason: { type: "string", description: "Why it needs escalation." },
        },
        required: ["hazard"],
      },
    },
  },
  {
    type: "function" as const,
    async: true,
    function: {
      name: "generateReport",
      description: "Generate the final site safety inspection report from everything found so far.",
      parameters: { type: "object" as const, properties: {}, required: [] },
    },
  },
];

function buildModel() {
  const base = {
    messages: [{ role: "system" as const, content: SYSTEM_PROMPT }],
    tools: TOOLS,
    temperature: 0.4,
    maxTokens: 250,
  };
  if (useNebius) {
    return {
      provider: "custom-llm" as const,
      url: "https://api.tokenfactory.nebius.com/v1",
      model: "meta-llama/Llama-3.3-70B-Instruct",
      ...base,
    };
  }
  return { provider: "openai" as const, model: "gpt-4o-mini", ...base };
}

function buildAssistantConfig() {
  const cfg: any = {
    name: ASSISTANT_NAME,
    firstMessage:
      "SiteGuard here, your site safety supervisor. I'm ready to walk the site with you. Want me to run today's safety checklist, or should I take a look at an area?",
    model: buildModel(),
    voice: { provider: "vapi", voiceId: "Elliot" },
    transcriber: { provider: "deepgram", model: "nova-2", language: "en" },
    clientMessages: ["transcript", "tool-calls", "status-update", "conversation-update"],
    silenceTimeoutSeconds: 30,
  };
  if (useNebius) {
    // Inline credential so Vapi can authenticate to Nebius for the custom-llm.
    cfg.credentials = [{ provider: "custom-llm", apiKey: config.nebiusApiKey, name: "Nebius Token Factory" }];
  }
  return cfg;
}

function persistAssistantId(id: string) {
  const path = new URL("../.env", import.meta.url);
  let env = readFileSync(path, "utf8");
  for (const key of ["VAPI_ASSISTANT_ID", "VITE_VAPI_ASSISTANT_ID"]) {
    if (new RegExp(`^${key}=.*$`, "m").test(env)) {
      env = env.replace(new RegExp(`^${key}=.*$`, "m"), `${key}=${id}`);
    } else {
      env += `\n${key}=${id}\n`;
    }
  }
  writeFileSync(path, env);
}

async function main() {
  const client = new VapiClient({ token: config.vapi.privateKey });
  const cfg = buildAssistantConfig();
  console.log(`LLM provider: ${useNebius ? "Nebius custom-llm (Llama-3.3-70B)" : "Vapi OpenAI (gpt-4o-mini)"}`);

  const existing = (await client.assistants.list()).find((a) => a.name === ASSISTANT_NAME);
  let assistant;
  if (existing) {
    assistant = await client.assistants.update(existing.id, cfg);
    console.log(`Updated assistant ${assistant.id}`);
  } else {
    assistant = await client.assistants.create(cfg);
    console.log(`Created assistant ${assistant.id}`);
  }
  persistAssistantId(assistant.id);
  console.log(`Wrote VAPI_ASSISTANT_ID / VITE_VAPI_ASSISTANT_ID to .env`);
}

main().catch((e) => {
  console.error(e?.body ?? e);
  process.exit(1);
});
