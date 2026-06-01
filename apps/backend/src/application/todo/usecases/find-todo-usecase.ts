import { EntityNotFoundException, type TransactionManager } from "../../../domain/shared";
import type { Todo } from "../../../domain/todo/entities/todo";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import { TodoId } from "../../../domain/todo/value-objects/todo-id";

/**
 * Use case for retrieving a Todo by ID.
 */
export class FindTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * Retrieves a Todo aggregate.
   *
   * @param id - Todo UUID string.
   *
   * @returns Matching Todo aggregate.
   *
   * @throws {EntityNotFoundException} When the Todo does not exist.
   */
  async execute(id: string): Promise<Todo> {
    const todoId = TodoId.parse(id);

    return this.transactionManager.runInTransaction(async (ctx) => {
      const todo = await this.todoRepository.findById(ctx, todoId);

      if (todo === null) {
        throw new EntityNotFoundException("Todo", id);
      }

      return todo;
    });
  }
}
