import { describe, expect, it } from "bun:test";
import { PGlite } from "@electric-sql/pglite";

import { createAppContainer } from "../bootstrap/app-container";
import { createDrizzleDatabase } from "../infrastructure/psql/drizzle/drizzle-database";
import { createApp } from "./app";

describe("backend app", () => {
  it("allows API docs origin to send browser test requests", async () => {
    const db = createDrizzleDatabase(new PGlite());
    const container = createAppContainer({
      db,
    });
    const app = createApp({
      container,
    });

    try {
      const preflightResponse = await app.request("/todos", {
        headers: {
          "access-control-request-headers": "content-type",
          "access-control-request-method": "POST",
          origin: "http://localhost:3001",
        },
        method: "OPTIONS",
      });

      expect(preflightResponse.status).toBe(204);
      expect(preflightResponse.headers.get("access-control-allow-origin")).toBe(
        "http://localhost:3001",
      );
      expect(preflightResponse.headers.get("access-control-allow-methods")).toContain("POST");
      expect(preflightResponse.headers.get("access-control-allow-headers")).toContain(
        "Content-Type",
      );
    } finally {
      await container.dispose();
    }
  });

  it("creates, lists, starts, and completes todos through REST routes", async () => {
    const db = createDrizzleDatabase(new PGlite());
    const container = createAppContainer({
      db,
    });
    const app = createApp({
      container,
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
      await container.dispose();
    }
  });
});
