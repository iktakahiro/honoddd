import { contract } from "@honoddd/contract";
import { ORPCError, implement } from "@orpc/server";

import { DomainException, EntityNotFoundException } from "../domain/shared";
import type { ORPCContext } from "./orpc-context";
import { presentTodo } from "./todo-presenter";

export function createORPCRouter() {
  const os = implement(contract).$context<ORPCContext>();

  return os.router({
    todo: {
      complete: os.todo.complete.handler(({ context, input }) =>
        mapApplicationErrors(async () =>
          presentTodo(await context.container.todoUseCases.completeTodo.execute(input.id)),
        ),
      ),
      create: os.todo.create.handler(({ context, input }) =>
        mapApplicationErrors(async () =>
          presentTodo(await context.container.todoUseCases.createTodo.execute(input)),
        ),
      ),
      findById: os.todo.findById.handler(({ context, input }) =>
        mapApplicationErrors(async () =>
          presentTodo(await context.container.todoUseCases.findTodo.execute(input.id)),
        ),
      ),
      list: os.todo.list.handler(({ context, input }) =>
        mapApplicationErrors(async () => ({
          items: (
            await context.container.todoUseCases.listTodos.execute(
              input.status === undefined
                ? undefined
                : {
                    status: input.status,
                  },
            )
          ).map(presentTodo),
        })),
      ),
      remove: os.todo.remove.handler(({ context, input }) =>
        mapApplicationErrors(() => context.container.todoUseCases.deleteTodo.execute(input.id)),
      ),
      start: os.todo.start.handler(({ context, input }) =>
        mapApplicationErrors(async () =>
          presentTodo(await context.container.todoUseCases.startTodo.execute(input.id)),
        ),
      ),
      update: os.todo.update.handler(({ context, input }) =>
        mapApplicationErrors(async () =>
          presentTodo(await context.container.todoUseCases.updateTodo.execute(input)),
        ),
      ),
    },
  });
}

async function mapApplicationErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      throw new ORPCError("NOT_FOUND", {
        message: error.message,
      });
    }

    if (error instanceof DomainException) {
      throw new ORPCError("BAD_REQUEST", {
        message: error.message,
      });
    }

    throw error;
  }
}
