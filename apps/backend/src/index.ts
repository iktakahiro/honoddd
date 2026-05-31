import { createApp } from "./api/app";
import { createAppContainer } from "./bootstrap/app-container";

const port = Number(Bun.env.PORT ?? 3000);
const corsOrigins = Bun.env.CORS_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const container = createAppContainer();
const app = createApp({
  container,
  ...(corsOrigins === undefined || corsOrigins.length === 0 ? {} : { corsOrigins }),
});

const server = Bun.serve({
  fetch: app.fetch,
  port,
});
const keepAliveInterval = setInterval(() => {}, 1_000_000_000);

console.log(`Backend API listening on http://localhost:${port}`);

/**
 * Stops the HTTP server and disposes long-lived infrastructure resources.
 */
async function shutdown(): Promise<void> {
  clearInterval(keepAliveInterval);
  server.stop(true);
  await container.dispose();
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});
