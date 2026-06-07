import { z } from "zod";

export type CompletionProvider = {
  complete(prompt: string): Promise<string>;
};

export class JsonGenerationError extends Error {
  constructor(message: string, public readonly raw?: string) {
    super(message);
    this.name = "JsonGenerationError";
  }
}

function extractJson(raw: string) {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return trimmed;
}

function parseAndValidate<T>(raw: string, schema: z.ZodType<T>) {
  try {
    return schema.parse(JSON.parse(extractJson(raw)));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new JsonGenerationError(message, raw);
  }
}

export async function generateJson<T>(
  provider: CompletionProvider,
  schema: z.ZodType<T>,
  prompt: string,
) {
  const raw = await provider.complete(prompt);

  try {
    return parseAndValidate(raw, schema);
  } catch (firstError) {
    const repairPrompt = [
      "Return only valid JSON matching the requested schema.",
      "Do not add markdown, comments, prices, deadlines, or facts that were not in the input.",
      "Repair this invalid response:",
      firstError instanceof JsonGenerationError ? firstError.raw ?? raw : raw,
    ].join("\n\n");
    const repaired = await provider.complete(repairPrompt);

    try {
      return parseAndValidate(repaired, schema);
    } catch (repairError) {
      const message = repairError instanceof Error ? repairError.message : String(repairError);
      throw new JsonGenerationError(`JSON generation failed after repair retry: ${message}`, repaired);
    }
  }
}
