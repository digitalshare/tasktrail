# SiteGuard AI — Mobile Outdoor Coworker (Construction Site Safety Supervisor)

A mobile-phone-simulation web app demoing an **AI field-worker teammate**: a construction-site
safety supervisor the worker talks to hands-free. It walks the worker through a safety checklist,
**sees** site imagery and flags hazards, escalates critical risks, and auto-generates an inspection
report.

Built on the requested stack:

| Layer | Tech | Role |
|------|------|------|
| **Voice** | [Vapi](https://vapi.ai) (`@vapi-ai/web`) | Live in-browser voice + function/tool calls |
| **Models** | [Nebius Token Factory](https://tokenfactory.nebius.com) | `Qwen2.5-VL-72B` for vision; `Llama-3.3-70B` as the assistant's brain (Vapi custom-llm) |
| **Backend** | [InsForge](https://insforge.dev) | Postgres tables, storage, and a Deno **edge function** (`site-ops`) that proxies Nebius and does all writes |
| **Frontend** | Vite + React + Tailwind | iPhone-style phone simulator |

## Architecture

```
Browser (phone sim)                         InsForge
  @vapi-ai/web  ── voice ──►  Vapi cloud (Llama-3.3-70B via Nebius custom-llm)
       │  tool-calls (analyzeCurrentView, escalateHazard, …)
       ▼
  voice/tools.ts ──► POST /functions/site-ops ──►  Deno edge fn ──► Nebius Qwen2.5-VL (vision)
       │                                              └─► writes findings/reports/escalations (admin key)
       └── anon-key REST reads (checklist, findings)
```

Why this shape: the demo images live in the browser, so vision is browser-initiated (base64 → edge
function). The edge function holds the **Nebius key and the InsForge admin key** server-side, so the
browser only ever carries the public anon key. The anon key is read-only by default (RLS), so every
write goes through the function. The assistant's voice reactions are driven by injecting tool results
back into the call (`vapi.send({type:'add-message', …})`).

## Setup

```bash
npm install
cp .env.example .env     # fill in Nebius, Vapi, and InsForge keys
```

Provision the backend and create the assistant (idempotent — safe to re-run):

```bash
npm run insforge:provision   # tables, storage bucket, secrets, deploy site-ops edge fn
npm run insforge:seed        # seed the safety checklist
npm run vapi:bootstrap       # create the "SiteGuard" Vapi assistant (writes VAPI_ASSISTANT_ID to .env)
```

Run the app:

```bash
npm run web:dev              # http://localhost:5173
```

> The assistant's brain runs on Nebius by default. Set `VAPI_LLM=openai npm run vapi:bootstrap` to
> fall back to Vapi's built-in OpenAI provider if needed for a demo.

## Demo script

1. Open the app, tap **Start inspection**, allow the mic.
2. Say **"What should I check first?"** → SiteGuard reads the checklist.
3. Pick a camera view (e.g. the scaffold) and say **"Check this area for hazards"** (or tap **⚡ Scan this view**).
   → Nebius analyzes it, AR markers + a hazard list appear, and SiteGuard briefs you by voice.
4. A high/critical hazard auto-escalates (red banner) and is logged.
5. Tap a checklist item (or let the AI mark it) to track progress.
6. Say **"Generate the report"** (or tap **📋 Report**) → a scored safety report appears, saved to InsForge.
7. Tap **↺** to reset the demo.

## Scripts

- `npm run nebius:demo` — sanity-check Nebius access
- `npm run insforge:provision` / `:seed` — backend setup
- `npm run vapi:bootstrap` — create/update the voice assistant
- `npm run web:dev` / `web:build` — run / build the phone simulator

Backend source: `insforge/` (provision, seed, `functions/site-ops.ts`). Frontend: `web/`.
Assistant definition: `scripts/bootstrap-assistant.ts`.
