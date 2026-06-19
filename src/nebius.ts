import "dotenv/config";
import OpenAI from "openai";

// Nebius Token Factory is OpenAI-API compatible, so we use the official
// OpenAI SDK pointed at the Nebius endpoint.
// Docs: https://docs.tokenfactory.nebius.com/quickstart
const apiKey = process.env.NEBIUS_API_KEY;
if (!apiKey) {
  throw new Error(
    "NEBIUS_API_KEY is not set. Add it to ~/.zprofile or a .env file before calling Nebius.",
  );
}

export const nebius = new OpenAI({
  baseURL: "https://api.tokenfactory.nebius.com/v1/",
  apiKey,
});

// Sensible default model — override per call as needed.
// Browse available IDs: GET https://api.tokenfactory.nebius.com/v1/models
export const DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct";

/** Minimal chat helper. Returns the assistant's text reply. */
export async function chat(
  prompt: string,
  opts: { model?: string; system?: string } = {},
): Promise<string> {
  const res = await nebius.chat.completions.create({
    model: opts.model ?? DEFAULT_MODEL,
    messages: [
      ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
      { role: "user" as const, content: prompt },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

/** The only vision-capable model in this Nebius account. */
export const VISION_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct";

/**
 * Run a vision-language analysis over an image and return raw model text.
 * `image` must be a base64 data URL (e.g. "data:image/jpeg;base64,...").
 * Nebius cannot reliably fetch external image URLs, so always pass base64.
 * Retries transient 5xx a few times.
 */
export async function visionAnalyze(
  image: string,
  prompt: string,
  opts: { json?: boolean; model?: string } = {},
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await nebius.chat.completions.create({
        model: opts.model ?? VISION_MODEL,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      });
      return res.choices[0]?.message?.content ?? "";
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}
