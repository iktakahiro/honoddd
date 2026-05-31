import { createOpenAPISpec } from "@honoddd/contract";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";

export function createApp() {
  const app = new Hono();

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "api-doc",
    }),
  );

  app.get("/openapi.json", async (c) =>
    c.json(
      await createOpenAPISpec({
        servers: [
          {
            description: "Backend API",
            url: Bun.env.BACKEND_API_URL ?? "http://localhost:3000",
          },
        ],
      }),
    ),
  );

  app.get(
    "/",
    Scalar({
      pageTitle: "Hono DDD API Reference",
      theme: "default",
      url: "/openapi.json",
    }),
  );

  return app;
}

export const app = createApp();
