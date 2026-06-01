import { eq } from "drizzle-orm";

import type { TransactionContext } from "../../../../../domain/shared";
import type { Todo } from "../../../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../../../domain/todo/repositories/todo-repository";
import type { TodoId } from "../../../../../domain/todo/value-objects/todo-id";
import type { TodoStatus } from "../../../../../domain/todo/value-objects/todo-status";
import {
  createDrizzleDatabase,
  migrateDrizzleSchema,
  type DrizzleDatabase,
  type DrizzleExecutor,
} from "../../drizzle-database";
import { getDrizzleTransaction } from "../../drizzle-transaction";
import { todoTable } from "../../schemas/todo-schema";
import { toTodo, toTodoTableInsert, toTodoTableUpdate } from "./todo-mapper";

/**
 * Drizzle implementation of {@link TodoRepository}.
 *
 * @remarks
 * The repository waits for schema migration readiness before executing database
 * operations and runs them through the provided {@link TransactionContext}.
 */
export class DrizzleTodoRepository implements TodoRepository {
  private readonly ready: Promise<void>;

  constructor(
    private readonly db: DrizzleDatabase = createDrizzleDatabase(),
    ready: Promise<void> = migrateDrizzleSchema(db),
  ) {
    this.ready = ready;
  }

  /**
   * Closes the underlying PGlite client.
   */
  async close(): Promise<void> {
    await this.ready;
    await this.db.$client.close();
  }

  /**
   * {@link TodoRepository.create}
   */
  async create(ctx: TransactionContext, todo: Todo): Promise<void> {
    await this.ready;

    await this.getExecutor(ctx).insert(todoTable).values(toTodoTableInsert(todo));
  }

  /**
   * {@link TodoRepository.update}
   */
  async update(ctx: TransactionContext, todo: Todo): Promise<void> {
    await this.ready;

    await this.getExecutor(ctx)
      .update(todoTable)
      .set(toTodoTableUpdate(todo))
      .where(eq(todoTable.id, todo.id));
  }

  /**
   * {@link TodoRepository.findById}
   */
  async findById(ctx: TransactionContext, todoId: TodoId): Promise<Todo | null> {
    await this.ready;

    const [row] = await this.getExecutor(ctx)
      .select()
      .from(todoTable)
      .where(eq(todoTable.id, todoId))
      .limit(1);

    return row === undefined ? null : toTodo(row);
  }

  /**
   * {@link TodoRepository.list}
   */
  async list(ctx: TransactionContext, filter: { status?: TodoStatus } = {}): Promise<Todo[]> {
    await this.ready;
    const db = this.getExecutor(ctx);

    const rows =
      filter.status === undefined
        ? await db.select().from(todoTable).orderBy(todoTable.createdAt)
        : await db
            .select()
            .from(todoTable)
            .where(eq(todoTable.status, filter.status))
            .orderBy(todoTable.createdAt);

    return rows.map(toTodo);
  }

  /**
   * {@link TodoRepository.delete}
   */
  async delete(ctx: TransactionContext, todoId: TodoId): Promise<void> {
    await this.ready;

    await this.getExecutor(ctx).delete(todoTable).where(eq(todoTable.id, todoId));
  }

  /**
   * Extracts the transaction-bound Drizzle executor.
   */
  private getExecutor(ctx: TransactionContext): DrizzleExecutor {
    return getDrizzleTransaction(ctx);
  }
}
