import { Todo } from "../../../../../domain/todo/entities/todo";
import { TodoDescription } from "../../../../../domain/todo/value-objects/todo-description";
import { TodoId } from "../../../../../domain/todo/value-objects/todo-id";
import { TodoTitle } from "../../../../../domain/todo/value-objects/todo-title";
import type { TodoTableInsert, TodoTableRow } from "../../schemas/todo-schema";

/**
 * Update row shape for Todo fields that can change after creation.
 */
export type TodoTableUpdate = Pick<
  TodoTableInsert,
  "completedAt" | "description" | "status" | "title" | "updatedAt"
>;

/**
 * Converts a Drizzle Todo row into a domain aggregate.
 *
 * @param row - Drizzle row from the `todos` table.
 *
 * @returns Rehydrated Todo aggregate.
 */
export function toTodo(row: TodoTableRow): Todo {
  return Todo.restore({
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    description: row.description === null ? null : TodoDescription.create(row.description),
    id: TodoId.parse(row.id),
    status: row.status,
    title: TodoTitle.create(row.title),
    updatedAt: row.updatedAt,
  });
}

/**
 * Converts a Todo aggregate into an insert row.
 *
 * @param todo - Todo aggregate to persist.
 *
 * @returns Drizzle insert row.
 */
export function toTodoTableInsert(todo: Todo): TodoTableInsert {
  const snapshot = todo.snapshot();

  return {
    completedAt: snapshot.completedAt,
    createdAt: snapshot.createdAt,
    description: snapshot.description?.value ?? null,
    id: snapshot.id,
    status: snapshot.status,
    title: snapshot.title.value,
    updatedAt: snapshot.updatedAt,
  };
}

/**
 * Converts a Todo aggregate into an update row.
 *
 * @param todo - Todo aggregate to update.
 *
 * @returns Drizzle update row.
 */
export function toTodoTableUpdate(todo: Todo): TodoTableUpdate {
  const snapshot = todo.snapshot();

  return {
    completedAt: snapshot.completedAt,
    description: snapshot.description?.value ?? null,
    status: snapshot.status,
    title: snapshot.title.value,
    updatedAt: snapshot.updatedAt,
  };
}
