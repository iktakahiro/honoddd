import { createApp } from "./api/app";
import { createAppContainer } from "./bootstrap/app-container";

const port = Number(Bun.env.PORT ?? 3000);
const container = createAppContainer();
const app = createApp({
  container,
});

const server = Bun.serve({
  fetch: app.fetch,
  port,
});
const keepAliveInterval = setInterval(() => {}, 1_000_000_000);

console.log(`Backend API listening on http://localhost:${port}`);

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
