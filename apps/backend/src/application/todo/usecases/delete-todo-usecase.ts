import { EntityNotFoundException, type TransactionManager } from "../../../domain/shared";
import type { TodoRepository } from "../../../domain/todo/repositories/todo-repository";
import { TodoId } from "../../../domain/todo/value-objects/todo-id";

/**
 * Use case for deleting a Todo.
 */
export class DeleteTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  /**
   * Deletes a Todo after verifying that it exists.
   *
   * @param id - Todo UUID string.
   *
   * @returns Deleted Todo identifier.
   *
   * @throws {EntityNotFoundException} When the Todo does not exist.
   */
  async execute(id: string): Promise<{ id: string }> {
    const todoId = TodoId.parse(id);

    return this.transactionManager.runInTransaction(async (ctx) => {
      const todo = await this.todoRepository.findById(todoId, ctx);

      if (todo === null) {
        throw new EntityNotFoundException("Todo", id);
      }

      await this.todoRepository.delete(todoId, ctx);

      return {
        id,
      };
    });
  }
}
