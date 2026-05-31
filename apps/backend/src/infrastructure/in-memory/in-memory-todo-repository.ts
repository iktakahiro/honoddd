import { Todo } from "../../domain/todo/entities/todo";
import type { TodoRepository } from "../../domain/todo/repositories/todo-repository";
import type { TodoId } from "../../domain/todo/value-objects/todo-id";
import type { TodoStatus } from "../../domain/todo/value-objects/todo-status";

export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos = new Map<string, Todo>();

  async delete(todoId: TodoId): Promise<void> {
    this.todos.delete(todoId);
  }

  async findAll(filter: { status?: TodoStatus } = {}): Promise<Todo[]> {
    return Array.from(this.todos.values())
      .filter((todo) => filter.status === undefined || todo.status === filter.status)
      .map((todo) => Todo.restore(todo.snapshot()));
  }

  async findById(todoId: TodoId): Promise<Todo | null> {
    const todo = this.todos.get(todoId);

    return todo === undefined ? null : Todo.restore(todo.snapshot());
  }

  async save(todo: Todo): Promise<void> {
    this.todos.set(todo.id, Todo.restore(todo.snapshot()));
  }
}
