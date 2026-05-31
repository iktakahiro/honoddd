import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import { ZodSmartCoercionPlugin } from "@orpc/zod";
import { Hono } from "hono";

import type { TransactionManager } from "../domain/shared";
import type { TodoRepository } from "../domain/todo/repositories/todo-repository";
import { createORPCRouter } from "./orpc-router";

export type AppDependencies = {
  todoRepository: TodoRepository;
  transactionManager: TransactionManager;
};

export function createApp(dependencies: AppDependencies) {
  const app = new Hono();
  const { todoRepository, transactionManager } = dependencies;
  const handler = new OpenAPIHandler(createORPCRouter(todoRepository, transactionManager), {
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
    const { matched, response } = await handler.handle(c.req.raw, {
      context: {},
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
