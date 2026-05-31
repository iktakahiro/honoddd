import { describe, expect, it } from "bun:test";

import {
  createDrizzleDatabase,
  migrateDrizzleSchema,
} from "../infrastructure/drizzle/drizzle-database";
import { DrizzleTransactionManager } from "../infrastructure/drizzle/drizzle-transaction";
import { DrizzleTodoRepository } from "../infrastructure/drizzle/todo/repositories/drizzle-todo-repository";
import { createApp } from "./app";

describe("backend app", () => {
  it("creates, lists, starts, and completes todos through REST routes", async () => {
    const db = createDrizzleDatabase();
    const ready = migrateDrizzleSchema(db);
    const todoRepository = new DrizzleTodoRepository(db, ready);
    const transactionManager = new DrizzleTransactionManager(db, ready);
    const app = createApp({
      todoRepository,
      transactionManager,
    });

    try {
      const createResponse = await app.request("/todos", {
        body: JSON.stringify({
          description: "Keep the contract as the boundary",
          title: "Wire Hono to oRPC",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      expect(createResponse.status).toBe(201);

      const created = await createResponse.json();

      expect(created.id).toBeString();
      expect(created.status).toBe("not_started");

      const listResponse = await app.request("/todos");
      const listBody = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listBody.items).toHaveLength(1);

      const startResponse = await app.request(`/todos/${created.id}/start`, {
        method: "POST",
      });
      const started = await startResponse.json();

      expect(started.status).toBe("in_progress");

      const completeResponse = await app.request(`/todos/${created.id}/complete`, {
        method: "POST",
      });
      const completed = await completeResponse.json();

      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBeString();
    } finally {
      await todoRepository.close();
    }
  });
});
