import type { TransactionContext } from "../../shared";
import type { Todo } from "../entities/todo";
import type { TodoId } from "../value-objects/todo-id";
import type { TodoStatus } from "../value-objects/todo-status";

export interface TodoRepository {
  create(todo: Todo, ctx?: TransactionContext): Promise<void>;
  update(todo: Todo, ctx?: TransactionContext): Promise<void>;
  findById(todoId: TodoId, ctx?: TransactionContext): Promise<Todo | null>;
  list(filter?: { status?: TodoStatus }, ctx?: TransactionContext): Promise<Todo[]>;
  delete(todoId: TodoId, ctx?: TransactionContext): Promise<void>;
}
