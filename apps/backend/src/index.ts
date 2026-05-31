import { createApp } from "./api/app";
import {
  createDrizzleDatabase,
  migrateDrizzleSchema,
} from "./infrastructure/drizzle/drizzle-database";
import { DrizzleTransactionManager } from "./infrastructure/drizzle/drizzle-transaction";
import { DrizzleTodoRepository } from "./infrastructure/drizzle/todo/repositories/drizzle-todo-repository";

const port = Number(Bun.env.PORT ?? 3000);
const db = createDrizzleDatabase();
const ready = migrateDrizzleSchema(db);
const todoRepository = new DrizzleTodoRepository(db, ready);
const transactionManager = new DrizzleTransactionManager(db, ready);
const app = createApp({
  todoRepository,
  transactionManager,
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
  await todoRepository.close();
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown();
});

process.on("SIGINT", () => {
  void shutdown();
});
