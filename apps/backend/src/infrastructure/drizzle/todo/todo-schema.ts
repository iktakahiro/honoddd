import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import type { DrizzleDatabase } from "../drizzle-database";
import { TodoStatus } from "../../../domain/todo/value-objects/todo-status";

export const todoTable = pgTable("todos", {
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  description: text("description"),
  id: text("id").primaryKey(),
  status: text("status", {
    enum: [TodoStatus.NotStarted, TodoStatus.InProgress, TodoStatus.Completed],
  }).notNull(),
  title: text("title").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export type TodoTableInsert = typeof todoTable.$inferInsert;
export type TodoTableRow = typeof todoTable.$inferSelect;

export async function migrateTodoSchema(db: DrizzleDatabase): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS todos_status_idx ON todos (status)
  `);
}
