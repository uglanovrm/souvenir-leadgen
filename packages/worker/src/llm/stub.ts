import type { CompletionProvider } from "./generate-json.js";

export class StubProvider implements CompletionProvider {
  private index = 0;

  constructor(private readonly responses: string[]) {}

  async complete() {
    const response = this.responses[this.index] ?? this.responses.at(-1) ?? "{}";
    this.index += 1;
    return response;
  }
}
