import { createOpenAPISpec } from "@honoddd/contract";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";

type ScalarOperation = {
  method?: string;
  path?: string;
};

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
      operationsSorter: (a: ScalarOperation, b: ScalarOperation) => {
        const operationOrder = [
          "POST /todos",
          "GET /todos",
          "GET /todos/{id}",
          "PATCH /todos/{id}",
          "DELETE /todos/{id}",
          "POST /todos/{id}/start",
          "POST /todos/{id}/complete",
        ];

        const getKey = (operation: ScalarOperation) =>
          `${operation.method?.toUpperCase() ?? ""} ${operation.path ?? ""}`;
        const getOrder = (operation: ScalarOperation) => {
          const index = operationOrder.indexOf(getKey(operation));

          return index === -1 ? Number.MAX_SAFE_INTEGER : index;
        };

        const order = getOrder(a) - getOrder(b);

        if (order !== 0) {
          return order;
        }

        return getKey(a).localeCompare(getKey(b));
      },
      orderSchemaPropertiesBy: "preserve",
      pageTitle: "Hono DDD API Reference",
      tagsSorter: "alpha",
      theme: "default",
      url: "/openapi.json",
    }),
  );

  return app;
}

export const app = createApp();
