import type { TransactionManager } from "../../../domain/shared";
import type { Todo } from "../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import type { TodoStatus } from "../../../domain/todo/value-objects/todo-status";

export class ListTodosUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(filter?: { status?: TodoStatus }): Promise<Todo[]> {
    return this.transactionManager.runInTransaction((ctx) => this.todoRepository.list(filter, ctx));
  }
}
