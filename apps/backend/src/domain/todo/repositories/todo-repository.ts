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
   * @param todo - Todo aggregate to create.
   * @param ctx - Optional transaction context.
   */
  create(todo: Todo, ctx?: TransactionContext): Promise<void>;

  /**
   * Persists changes to an existing Todo aggregate.
   *
   * @param todo - Todo aggregate to update.
   * @param ctx - Optional transaction context.
   */
  update(todo: Todo, ctx?: TransactionContext): Promise<void>;

  /**
   * Finds a Todo by identifier.
   *
   * @param todoId - Todo identifier.
   * @param ctx - Optional transaction context.
   *
   * @returns Matching Todo or `null` when it does not exist.
   */
  findById(todoId: TodoId, ctx?: TransactionContext): Promise<Todo | null>;

  /**
   * Lists Todo aggregates.
   *
   * @param filter - Optional filter values.
   * @param ctx - Optional transaction context.
   *
   * @returns Todos matching the filter.
   */
  list(filter?: { status?: TodoStatus }, ctx?: TransactionContext): Promise<Todo[]>;

  /**
   * Deletes a Todo by identifier.
   *
   * @param todoId - Todo identifier.
   * @param ctx - Optional transaction context.
   */
  delete(todoId: TodoId, ctx?: TransactionContext): Promise<void>;
}
