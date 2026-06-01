import type { TransactionContext } from "../../shared";
import type { Todo } from "../entities/todo";
import type { TodoId } from "../value-objects/todo-id";
import type { TodoStatus } from "../value-objects/todo-status";

/**
 * Repository abstraction for Todo aggregate persistence.
 *
 * @remarks
 * Application use cases depend on this interface so persistence technology and
 * database schema details remain outside the domain and application layers.
 */
export interface TodoRepository {
  /**
   * Persists a new Todo aggregate.
   *
   * @param ctx - Transaction context.
   * @param todo - Todo aggregate to create.
   */
  create(ctx: TransactionContext, todo: Todo): Promise<void>;

  /**
   * Persists changes to an existing Todo aggregate.
   *
   * @param ctx - Transaction context.
   * @param todo - Todo aggregate to update.
   */
  update(ctx: TransactionContext, todo: Todo): Promise<void>;

  /**
   * Finds a Todo by identifier.
   *
   * @param ctx - Transaction context.
   * @param todoId - Todo identifier.
   *
   * @returns Matching Todo or `null` when it does not exist.
   */
  findById(ctx: TransactionContext, todoId: TodoId): Promise<Todo | null>;

  /**
   * Lists Todo aggregates.
   *
   * @param ctx - Transaction context.
   * @param filter - Optional filter values.
   *
   * @returns Todos matching the filter.
   */
  list(ctx: TransactionContext, filter?: { status?: TodoStatus }): Promise<Todo[]>;

  /**
   * Deletes a Todo by identifier.
   *
   * @param ctx - Transaction context.
   * @param todoId - Todo identifier.
   */
  delete(ctx: TransactionContext, todoId: TodoId): Promise<void>;
}
