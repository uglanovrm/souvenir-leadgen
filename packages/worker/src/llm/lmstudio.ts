import type { CompletionProvider } from "./generate-json.js";

type LmStudioOptions = {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class LmStudioProvider implements CompletionProvider {
  constructor(private readonly options: LmStudioOptions) {}

  async complete(prompt: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 60000);

    try {
      const response = await fetch(`${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.options.model,
          messages: [
            {
              role: "system",
              content: "You produce strict JSON only. Never invent prices, deadlines, discounts, or supplier capabilities.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LM Studio request failed with HTTP ${response.status}`);
      }

      const payload = await response.json() as ChatCompletionResponse;
      const content = payload.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("LM Studio response did not include message content.");
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  }
}
