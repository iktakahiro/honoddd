import type { TodoResponse } from "@honoddd/contract";

import type { Todo } from "../domain/todo/entities/todo";

export function presentTodo(todo: Todo): TodoResponse {
  return {
    completedAt: todo.completedAt?.toISOString() ?? null,
    createdAt: todo.createdAt.toISOString(),
    description: todo.description?.value ?? null,
    id: todo.id,
    status: todo.status,
    title: todo.title.value,
    updatedAt: todo.updatedAt.toISOString(),
  };
}
