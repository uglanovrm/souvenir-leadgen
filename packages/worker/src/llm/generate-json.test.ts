import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generateJson, JsonGenerationError } from "./generate-json.js";
import { StubProvider } from "./stub.js";

const schema = z.object({
  warnings: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

describe("generateJson", () => {
  it("returns typed JSON from a provider", async () => {
    const result = await generateJson(new StubProvider(['{"warnings":[],"confidence":0.8}']), schema, "score");

    expect(result.confidence).toBe(0.8);
  });

  it("repairs invalid JSON once", async () => {
    const result = await generateJson(
      new StubProvider(["not-json", '{"warnings":["repaired"],"confidence":0.5}']),
      schema,
      "score",
    );

    expect(result.warnings).toEqual(["repaired"]);
  });

  it("throws a clear error after failed repair", async () => {
    await expect(generateJson(new StubProvider(["nope", "still nope"]), schema, "score"))
      .rejects
      .toBeInstanceOf(JsonGenerationError);
  });
});
