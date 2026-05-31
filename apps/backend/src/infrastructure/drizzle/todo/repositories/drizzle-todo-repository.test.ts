import { describe, expect, it } from "bun:test";

import { Todo } from "../../../../domain/todo/entities/todo";
import { TodoDescription } from "../../../../domain/todo/value-objects/todo-description";
import { TodoId } from "../../../../domain/todo/value-objects/todo-id";
import { TodoStatus } from "../../../../domain/todo/value-objects/todo-status";
import { TodoTitle } from "../../../../domain/todo/value-objects/todo-title";
import { createDrizzleDatabase, migrateDrizzleSchema } from "../../drizzle-database";
import { DrizzleTransactionManager } from "../../drizzle-transaction";
import { DrizzleTodoRepository } from "./drizzle-todo-repository";

describe("DrizzleTodoRepository", () => {
  it("persists and restores todo aggregate state with PGlite", async () => {
    const db = createDrizzleDatabase();
    const ready = migrateDrizzleSchema(db);
    const repository = new DrizzleTodoRepository(db, ready);
    const transactionManager = new DrizzleTransactionManager(db, ready);

    try {
      const todo = Todo.create({
        description: TodoDescription.create("Use PostgreSQL semantics without a server"),
        id: TodoId.parse("11111111-1111-4111-8111-111111111111"),
        now: new Date("2026-05-31T00:00:00.000Z"),
        title: TodoTitle.create("Persist todos with Drizzle"),
      });

      await transactionManager.runInTransaction((ctx) => repository.save(todo, ctx));

      const found = await repository.findById(todo.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(todo.id);
      expect(found?.title.value).toBe("Persist todos with Drizzle");
      expect(found?.description?.value).toBe("Use PostgreSQL semantics without a server");
      expect(found?.status).toBe(TodoStatus.NotStarted);
      expect(found?.createdAt.toISOString()).toBe("2026-05-31T00:00:00.000Z");

      todo.start(new Date("2026-05-31T00:01:00.000Z"));
      await transactionManager.runInTransaction((ctx) => repository.save(todo, ctx));

      const inProgressTodos = await repository.findAll({
        status: TodoStatus.InProgress,
      });

      expect(inProgressTodos).toHaveLength(1);
      expect(inProgressTodos[0]?.id).toBe(todo.id);

      await transactionManager.runInTransaction((ctx) => repository.delete(todo.id, ctx));

      await expect(repository.findById(todo.id)).resolves.toBeNull();
    } finally {
      await repository.close();
    }
  });

  it("rolls back writes through transaction context", async () => {
    const db = createDrizzleDatabase();
    const ready = migrateDrizzleSchema(db);
    const repository = new DrizzleTodoRepository(db, ready);
    const transactionManager = new DrizzleTransactionManager(db, ready);

    try {
      const todo = Todo.create({
        id: TodoId.parse("22222222-2222-4222-8222-222222222222"),
        title: TodoTitle.create("Rollback transactional writes"),
      });

      await expect(
        transactionManager.runInTransaction(async (ctx) => {
          await repository.save(todo, ctx);
          await ctx.rollback();
        }),
      ).rejects.toThrow();

      await expect(repository.findById(todo.id)).resolves.toBeNull();
    } finally {
      await repository.close();
    }
  });
});
