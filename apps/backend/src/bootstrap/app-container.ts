import { CompleteTodoUseCase } from "../application/todo/usecases/complete-todo-usecase";
import { CreateTodoUseCase } from "../application/todo/usecases/create-todo-usecase";
import { DeleteTodoUseCase } from "../application/todo/usecases/delete-todo-usecase";
import { FindTodoUseCase } from "../application/todo/usecases/find-todo-usecase";
import { ListTodosUseCase } from "../application/todo/usecases/list-todos-usecase";
import { StartTodoUseCase } from "../application/todo/usecases/start-todo-usecase";
import { UpdateTodoUseCase } from "../application/todo/usecases/update-todo-usecase";
import {
  createDrizzleDatabase,
  migrateDrizzleSchema,
  type DrizzleDatabase,
} from "../infrastructure/psql/drizzle/drizzle-database";
import { DrizzleTransactionManager } from "../infrastructure/psql/drizzle/drizzle-transaction";
import { DrizzleTodoRepository } from "../infrastructure/psql/drizzle/todo/repositories/drizzle-todo-repository";

/**
 * Use case instances exposed by the application container.
 */
export type TodoUseCases = {
  completeTodo: CompleteTodoUseCase;
  createTodo: CreateTodoUseCase;
  deleteTodo: DeleteTodoUseCase;
  findTodo: FindTodoUseCase;
  listTodos: ListTodosUseCase;
  startTodo: StartTodoUseCase;
  updateTodo: UpdateTodoUseCase;
};

/**
 * Runtime application container for backend dependencies.
 */
export type AppContainer = {
  dispose(): Promise<void>;
  todoUseCases: TodoUseCases;
};

/**
 * Options for constructing the application container.
 */
export type AppContainerOptions = {
  db?: DrizzleDatabase;
  ready?: Promise<void>;
};

/**
 * Creates the backend application container.
 *
 * @remarks
 * This is the composition root for concrete infrastructure dependencies used
 * by API handlers.
 *
 * @param options - Optional infrastructure overrides for tests or custom runtimes.
 *
 * @returns Application container with use cases and lifecycle cleanup.
 */
export function createAppContainer(options: AppContainerOptions = {}): AppContainer {
  const db = options.db ?? createDrizzleDatabase();
  const ready = options.ready ?? migrateDrizzleSchema(db);
  const todoRepository = new DrizzleTodoRepository(db, ready);
  const transactionManager = new DrizzleTransactionManager(db, ready);

  return {
    async dispose(): Promise<void> {
      await todoRepository.close();
    },
    todoUseCases: {
      completeTodo: new CompleteTodoUseCase(todoRepository, transactionManager),
      createTodo: new CreateTodoUseCase(todoRepository, transactionManager),
      deleteTodo: new DeleteTodoUseCase(todoRepository, transactionManager),
      findTodo: new FindTodoUseCase(todoRepository, transactionManager),
      listTodos: new ListTodosUseCase(todoRepository, transactionManager),
      startTodo: new StartTodoUseCase(todoRepository, transactionManager),
      updateTodo: new UpdateTodoUseCase(todoRepository, transactionManager),
    },
  };
}
