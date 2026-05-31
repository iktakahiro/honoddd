import type { TodoResponse } from "@honoddd/contract";

import type { Todo } from "../domain/todo/entities/todo";

/**
 * Converts a Todo aggregate into the API response shape.
 *
 * @param todo - Todo aggregate to present.
 *
 * @returns Serializable Todo response.
 */
export function presentTodo(todo: Todo): TodoResponse {
  return {
    id: todo.id,
    title: todo.title.value,
    description: todo.description?.value ?? null,
    status: todo.status,
    completedAt: todo.completedAt?.toISOString() ?? null,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}
