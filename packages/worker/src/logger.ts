type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, event: string, data: Record<string, unknown> = {}) {
  const line = {
    level,
    event,
    at: new Date().toISOString(),
    ...data,
  };

  console.log(JSON.stringify(line));
}
