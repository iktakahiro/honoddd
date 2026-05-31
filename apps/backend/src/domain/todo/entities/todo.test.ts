import { describe, expect, it } from "bun:test";

import { DomainException } from "../../shared";
import { TodoDescription } from "../value-objects/todo-description";
import { TodoId } from "../value-objects/todo-id";
import { TodoStatus } from "../value-objects/todo-status";
import { TodoTitle } from "../value-objects/todo-title";
import { Todo } from "./todo";

describe("Todo", () => {
  it("creates a not-started aggregate with normalized values", () => {
    const now = new Date("2026-05-31T00:00:00.000Z");
    const todo = Todo.create({
      description: TodoDescription.create("  Write focused tests  "),
      id: TodoId.parse("11111111-1111-4111-8111-111111111111"),
      now,
      title: TodoTitle.create("  Add Vitest coverage  "),
    });

    expect(todo.id).toBe(TodoId.parse("11111111-1111-4111-8111-111111111111"));
    expect(todo.title.value).toBe("Add Vitest coverage");
    expect(todo.description?.value).toBe("Write focused tests");
    expect(todo.status).toBe(TodoStatus.NotStarted);
    expect(todo.createdAt).toBe(now);
    expect(todo.updatedAt).toBe(now);
    expect(todo.completedAt).toBeNull();
  });

  it("starts a not-started todo and updates the timestamp", () => {
    const todo = Todo.create({
      id: TodoId.parse("22222222-2222-4222-8222-222222222222"),
      now: new Date("2026-05-31T00:00:00.000Z"),
      title: TodoTitle.create("Start work"),
    });
    const startedAt = new Date("2026-05-31T00:01:00.000Z");

    todo.start(startedAt);

    expect(todo.status).toBe(TodoStatus.InProgress);
    expect(todo.updatedAt).toBe(startedAt);
  });

  it("does not restart a completed todo", () => {
    const todo = Todo.create({
      id: TodoId.parse("33333333-3333-4333-8333-333333333333"),
      title: TodoTitle.create("Complete work"),
    });

    todo.start(new Date("2026-05-31T00:01:00.000Z"));
    todo.complete(new Date("2026-05-31T00:02:00.000Z"));

    expect(() => todo.start()).toThrow(DomainException);
  });

  it("completes only in-progress todos", () => {
    const todo = Todo.create({
      id: TodoId.parse("44444444-4444-4444-8444-444444444444"),
      title: TodoTitle.create("Complete after start"),
    });

    expect(() => todo.complete()).toThrow(DomainException);

    const completedAt = new Date("2026-05-31T00:03:00.000Z");

    todo.start(new Date("2026-05-31T00:02:00.000Z"));
    todo.complete(completedAt);

    expect(todo.status).toBe(TodoStatus.Completed);
    expect(todo.completedAt).toBe(completedAt);
    expect(todo.updatedAt).toBe(completedAt);
  });

  it("updates editable fields and leaves omitted fields unchanged", () => {
    const todo = Todo.create({
      description: TodoDescription.create("Existing description"),
      id: TodoId.parse("55555555-5555-4555-8555-555555555555"),
      now: new Date("2026-05-31T00:00:00.000Z"),
      title: TodoTitle.create("Existing title"),
    });
    const updatedAt = new Date("2026-05-31T00:04:00.000Z");

    todo.update({
      description: null,
      now: updatedAt,
    });

    expect(todo.title.value).toBe("Existing title");
    expect(todo.description).toBeNull();
    expect(todo.updatedAt).toBe(updatedAt);
  });

  it("restores a todo from a snapshot", () => {
    const snapshot = {
      completedAt: new Date("2026-05-31T00:03:00.000Z"),
      createdAt: new Date("2026-05-31T00:00:00.000Z"),
      description: TodoDescription.create("Restored description"),
      id: TodoId.parse("66666666-6666-4666-8666-666666666666"),
      status: TodoStatus.Completed,
      title: TodoTitle.create("Restored title"),
      updatedAt: new Date("2026-05-31T00:03:00.000Z"),
    };

    expect(Todo.restore(snapshot).snapshot()).toEqual(snapshot);
  });
});
