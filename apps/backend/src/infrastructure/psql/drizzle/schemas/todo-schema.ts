import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { TodoStatus } from "../../../../domain/todo/value-objects/todo-status";

export const todoStatusEnum = pgEnum("todo_status", [
  TodoStatus.NotStarted,
  TodoStatus.InProgress,
  TodoStatus.Completed,
]);

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

export type TodoTableInsert = typeof todoTable.$inferInsert;
export type TodoTableRow = typeof todoTable.$inferSelect;
