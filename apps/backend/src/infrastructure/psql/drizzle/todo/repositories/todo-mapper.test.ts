import { describe, expect, it } from "bun:test";

import { Todo } from "../../../../../domain/todo/entities/todo";
import { TodoDescription } from "../../../../../domain/todo/value-objects/todo-description";
import { TodoId } from "../../../../../domain/todo/value-objects/todo-id";
import { TodoStatus } from "../../../../../domain/todo/value-objects/todo-status";
import { TodoTitle } from "../../../../../domain/todo/value-objects/todo-title";
import type { TodoTableRow } from "../../schemas/todo-schema";
import { toTodo, toTodoTableInsert, toTodoTableUpdate } from "./todo-mapper";

describe("todo mapper", () => {
  it("converts a Drizzle row into a Todo aggregate", () => {
    const row: TodoTableRow = {
      completedAt: new Date("2026-05-31T00:03:00.000Z"),
      createdAt: new Date("2026-05-31T00:00:00.000Z"),
      description: "Mapped description",
      id: "11111111-1111-4111-8111-111111111111",
      status: TodoStatus.Completed,
      title: "Mapped title",
      updatedAt: new Date("2026-05-31T00:03:00.000Z"),
    };

    const todo = toTodo(row);

    expect(todo.id).toBe(TodoId.parse(row.id));
    expect(todo.title.value).toBe(row.title);
    expect(todo.description?.value).toBe(row.description ?? undefined);
    expect(todo.status).toBe(row.status);
    expect(todo.completedAt).toBe(row.completedAt);
    expect(todo.createdAt).toBe(row.createdAt);
    expect(todo.updatedAt).toBe(row.updatedAt);
  });

  it("converts a Todo aggregate into an insert row", () => {
    const todo = Todo.create({
      description: TodoDescription.create("Inserted description"),
      id: TodoId.parse("22222222-2222-4222-8222-222222222222"),
      now: new Date("2026-05-31T00:00:00.000Z"),
      title: TodoTitle.create("Inserted title"),
    });

    expect(toTodoTableInsert(todo)).toEqual({
      completedAt: null,
      createdAt: new Date("2026-05-31T00:00:00.000Z"),
      description: "Inserted description",
      id: "22222222-2222-4222-8222-222222222222",
      status: TodoStatus.NotStarted,
      title: "Inserted title",
      updatedAt: new Date("2026-05-31T00:00:00.000Z"),
    });
  });

  it("converts a Todo aggregate into an update row without immutable fields", () => {
    const todo = Todo.restore({
      completedAt: new Date("2026-05-31T00:03:00.000Z"),
      createdAt: new Date("2026-05-31T00:00:00.000Z"),
      description: null,
      id: TodoId.parse("33333333-3333-4333-8333-333333333333"),
      status: TodoStatus.Completed,
      title: TodoTitle.create("Updated title"),
      updatedAt: new Date("2026-05-31T00:03:00.000Z"),
    });

    const update = toTodoTableUpdate(todo);

    expect(update).toEqual({
      completedAt: new Date("2026-05-31T00:03:00.000Z"),
      description: null,
      status: TodoStatus.Completed,
      title: "Updated title",
      updatedAt: new Date("2026-05-31T00:03:00.000Z"),
    });
    expect("id" in update).toBe(false);
    expect("createdAt" in update).toBe(false);
  });
});
