import { app } from "./app";

const port = Number(Bun.env.PORT ?? 3001);

const server = Bun.serve({
  fetch: app.fetch,
  port,
});
const keepAliveInterval = setInterval(() => {}, 1_000_000_000);

console.log(`API docs listening on http://localhost:${port}`);

process.on("SIGTERM", () => {
  clearInterval(keepAliveInterval);
  server.stop(true);
  process.exit(0);
});
