import { contract } from "@honoddd/contract";
import { ORPCError, implement } from "@orpc/server";

import { CompleteTodoUseCase } from "../application/todo/usecases/complete-todo-usecase";
import { CreateTodoUseCase } from "../application/todo/usecases/create-todo-usecase";
import { DeleteTodoUseCase } from "../application/todo/usecases/delete-todo-usecase";
import { FindTodoUseCase } from "../application/todo/usecases/find-todo-usecase";
import { ListTodosUseCase } from "../application/todo/usecases/list-todos-usecase";
import { StartTodoUseCase } from "../application/todo/usecases/start-todo-usecase";
import { UpdateTodoUseCase } from "../application/todo/usecases/update-todo-usecase";
import { DomainException, EntityNotFoundException } from "../domain/shared";
import type { TodoRepository } from "../domain/todo/repositories/todo-repository";
import { presentTodo } from "./todo-presenter";

export function createORPCRouter(todoRepository: TodoRepository) {
  const os = implement(contract);
  const completeTodoUseCase = new CompleteTodoUseCase(todoRepository);
  const createTodoUseCase = new CreateTodoUseCase(todoRepository);
  const deleteTodoUseCase = new DeleteTodoUseCase(todoRepository);
  const findTodoUseCase = new FindTodoUseCase(todoRepository);
  const listTodosUseCase = new ListTodosUseCase(todoRepository);
  const startTodoUseCase = new StartTodoUseCase(todoRepository);
  const updateTodoUseCase = new UpdateTodoUseCase(todoRepository);

  return os.router({
    todo: {
      complete: os.todo.complete.handler(({ input }) =>
        mapApplicationErrors(async () => presentTodo(await completeTodoUseCase.execute(input.id))),
      ),
      create: os.todo.create.handler(({ input }) =>
        mapApplicationErrors(async () => presentTodo(await createTodoUseCase.execute(input))),
      ),
      findById: os.todo.findById.handler(({ input }) =>
        mapApplicationErrors(async () => presentTodo(await findTodoUseCase.execute(input.id))),
      ),
      list: os.todo.list.handler(({ input }) =>
        mapApplicationErrors(async () => ({
          items: (
            await listTodosUseCase.execute(
              input.status === undefined
                ? undefined
                : {
                    status: input.status,
                  },
            )
          ).map(presentTodo),
        })),
      ),
      remove: os.todo.remove.handler(({ input }) =>
        mapApplicationErrors(() => deleteTodoUseCase.execute(input.id)),
      ),
      start: os.todo.start.handler(({ input }) =>
        mapApplicationErrors(async () => presentTodo(await startTodoUseCase.execute(input.id))),
      ),
      update: os.todo.update.handler(({ input }) =>
        mapApplicationErrors(async () => presentTodo(await updateTodoUseCase.execute(input))),
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
