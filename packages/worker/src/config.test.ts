import { describe, expect, it } from "vitest";
import { loadWorkerConfig } from "./config.js";

describe("worker config", () => {
  it("loads safe defaults without secrets", () => {
    const config = loadWorkerConfig({});

    expect(config.WORKER_POLL_INTERVAL_MS).toBe(5000);
    expect(config.WORKER_MAX_ATTEMPTS).toBe(3);
    expect(config.WORKER_ID).toBe("local-worker-1");
    expect(config.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });

  it("parses numeric environment values", () => {
    const config = loadWorkerConfig({
      WORKER_POLL_INTERVAL_MS: "2500",
      WORKER_MAX_ATTEMPTS: "5",
    });

    expect(config.WORKER_POLL_INTERVAL_MS).toBe(2500);
    expect(config.WORKER_MAX_ATTEMPTS).toBe(5);
  });
});
