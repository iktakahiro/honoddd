import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import { ZodSmartCoercionPlugin } from "@orpc/zod";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId, type RequestIdVariables } from "hono/request-id";

import type { AppContainer } from "../bootstrap/app-container";
import type { ORPCContext } from "./orpc-context";
import { createORPCRouter } from "./orpc-router";

const defaultCorsOrigins = ["http://localhost:3001", "http://127.0.0.1:3001"];

type RequestLogger = (message: string, ...rest: string[]) => void;

export type AppDependencies = {
  container: AppContainer;
  corsOrigins?: string[];
  requestLogger?: RequestLogger | false;
};

export function createApp(dependencies: AppDependencies) {
  const app = new Hono<{
    Variables: RequestIdVariables;
  }>();
  const { container } = dependencies;
  const handler = new OpenAPIHandler(createORPCRouter(), {
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
    plugins: [new ZodSmartCoercionPlugin()],
  });

  app.use("*", requestId());

  if (dependencies.requestLogger !== false) {
    app.use("*", logger(dependencies.requestLogger));
  }

  app.use(
    "*",
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
      maxAge: 600,
      origin: dependencies.corsOrigins ?? defaultCorsOrigins,
    }),
  );

  app.use("*", compress());

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "backend",
    }),
  );

  app.use("*", async (c, next) => {
    const context: ORPCContext = {
      container,
      requestId: c.get("requestId"),
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
