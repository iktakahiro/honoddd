import { Todo } from "../../../../domain/todo/entities/todo";
import { TodoDescription } from "../../../../domain/todo/value-objects/todo-description";
import { TodoId } from "../../../../domain/todo/value-objects/todo-id";
import { TodoTitle } from "../../../../domain/todo/value-objects/todo-title";
import type { TodoTableInsert, TodoTableRow } from "../todo-schema";

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
