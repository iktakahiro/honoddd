import { EntityNotFoundException, type TransactionManager } from "../../../domain/shared";
import type { Todo } from "../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import { TodoId } from "../../../domain/todo/value-objects/todo-id";

/**
 * Use case for starting a Todo.
 */
export class StartTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * Starts a Todo and persists the aggregate.
   *
   * @param id - Todo UUID string.
   *
   * @returns Started Todo aggregate.
   *
   * @throws {EntityNotFoundException} When the Todo does not exist.
   */
  async execute(id: string): Promise<Todo> {
    const todoId = TodoId.parse(id);

    return this.transactionManager.runInTransaction(async (ctx) => {
      const todo = await this.todoRepository.findById(todoId, ctx);

      if (todo === null) {
        throw new EntityNotFoundException("Todo", id);
      }

      todo.start();
      await this.todoRepository.update(todo, ctx);

      return todo;
    });
  }
}
