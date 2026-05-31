import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import { ZodSmartCoercionPlugin } from "@orpc/zod";
import { Hono } from "hono";

import type { AppContainer } from "../bootstrap/app-container";
import type { ORPCContext } from "./orpc-context";
import { createORPCRouter } from "./orpc-router";

export type AppDependencies = {
  container: AppContainer;
};

export function createApp(dependencies: AppDependencies) {
  const app = new Hono();
  const { container } = dependencies;
  const handler = new OpenAPIHandler(createORPCRouter(), {
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
    plugins: [new ZodSmartCoercionPlugin()],
  });

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "backend",
    }),
  );

  app.use("*", async (c, next) => {
    const context: ORPCContext = {
      container,
      requestId: crypto.randomUUID(),
    };

    const { matched, response } = await handler.handle(c.req.raw, {
      context,
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    await next();
  });

  app.notFound((c) =>
    c.json(
      {
        message: "Not Found",
      },
      404,
    ),
  );

  return app;
}
