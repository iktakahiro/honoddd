import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { TodoStatus } from "../../../../domain/todo/value-objects/todo-status";

/**
 * PostgreSQL enum for Todo lifecycle states.
 */
export const todoStatusEnum = pgEnum("todo_status", [
  TodoStatus.NotStarted,
  TodoStatus.InProgress,
  TodoStatus.Completed,
]);

/**
 * Drizzle table schema for Todo persistence.
 */
export const todoTable = pgTable(
  "todos",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: todoStatusEnum("status").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("todos_status_idx").on(table.status)],
);

/**
 * Insert row type inferred from {@link todoTable}.
 */
export type TodoTableInsert = typeof todoTable.$inferInsert;

/**
 * Select row type inferred from {@link todoTable}.
 */
export type TodoTableRow = typeof todoTable.$inferSelect;
