import type { TransactionContext } from "../../shared";
import type { Todo } from "../entities/todo";
import type { TodoId } from "../value-objects/todo-id";
import type { TodoStatus } from "../value-objects/todo-status";

export interface TodoRepository {
  delete(todoId: TodoId, ctx?: TransactionContext): Promise<void>;
  findAll(filter?: { status?: TodoStatus }, ctx?: TransactionContext): Promise<Todo[]>;
  findById(todoId: TodoId, ctx?: TransactionContext): Promise<Todo | null>;
  save(todo: Todo, ctx?: TransactionContext): Promise<void>;
}
