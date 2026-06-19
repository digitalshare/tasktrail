import dotenv from "dotenv";

// `override: true` so this project's .env is the single source of truth even when
// the shell already exports INSFORGE_/NEBIUS_ vars for a different project.
dotenv.config({ override: true });

/** Centralized env access for Node-side scripts (provision, seed, bootstrap). */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set. Add it to .env (see .env.example).`);
  return v;
}

export const config = {
  nebiusApiKey: required("NEBIUS_API_KEY"),
  vapi: {
    privateKey: required("VAPI_API_PRIVATE_KEY"),
    publicKey: required("VAPI_API_PUBLIC_KEY"),
    assistantId: process.env.VAPI_ASSISTANT_ID ?? "",
  },
  insforge: {
    baseUrl: required("INSFORGE_BASE_URL").replace(/\/$/, ""),
    apiKey: required("INSFORGE_API_KEY"), // admin key — server-side only
    anonKey: required("INSFORGE_ANON_KEY"), // public key — safe in browser
  },
} as const;

/** The Nebius vision-language model id (the only VL model in this account). */
export const VISION_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct";
