import type { Todo } from "../entities/todo";
import type { TodoId } from "../value-objects/todo-id";
import type { TodoStatus } from "../value-objects/todo-status";

export interface TodoRepository {
  delete(todoId: TodoId): Promise<void>;
  findAll(filter?: { status?: TodoStatus }): Promise<Todo[]>;
  findById(todoId: TodoId): Promise<Todo | null>;
  save(todo: Todo): Promise<void>;
}
